#!/usr/bin/env bash
# Deploy Salish Sea Expeditions — the Godot build, on the `salish-sea-expedition` Cloud Run
# service — from your own machine, in one command:
#
#   bash deploy/godot-cloud-run.sh [PROJECT_ID] [REGION] [GITHUB_REPO]
#
# Defaults: your current gcloud project, us-west1, and this checkout's GitHub repository (which
# also sets up keyless deploys from GitHub Actions). It is self-sufficient — it applies the
# bootstrap root itself. Then:
#   1. applies infra/bootstrap — APIs, the image registry, and keyless GitHub deploys,
#   2. fetches Godot 4.5 and its web export templates (cached; GODOT=/path/to/godot uses yours),
#   3. exports the web build into build/web, with the four soundtrack pieces beside it in audio/,
#   4. builds Dockerfile.godot for linux/amd64, pushes it and resolves its digest,
#   5. applies infra/service with that digest (creating the service the first time) and rolls the
#      image out, waits for /health, and prints the URL.
# Terraform shows each plan and asks before applying; YES=1 approves automatically. Safe to re-run.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
die() { printf '\n\033[31m%s\033[0m\n' "$*" >&2; exit 1; }

# ---- Preflight: tools, login, project, billing, Docker ----
for tool in terraform gcloud docker curl unzip git; do
  command -v "$tool" >/dev/null || die "Install $tool first (see infra/README.md)."
done
project_id="${1:-$(gcloud config get-value project 2>/dev/null || true)}"
[[ -n "$project_id" ]] || die "No project given and none set: bash deploy/godot-cloud-run.sh YOUR_PROJECT_ID"
region="${2:-us-west1}"
default_repo="$(git remote get-url origin 2>/dev/null | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##; s#^.*/git/##')"
github_repo="${3-$default_repo}"

account="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | head -1)"
[[ -n "$account" ]] || die "Not logged in: gcloud auth login"
gcloud auth application-default print-access-token >/dev/null 2>&1 \
  || die "Terraform needs application-default credentials: gcloud auth application-default login"
gcloud projects describe "$project_id" --format='value(projectId)' >/dev/null 2>&1 \
  || die "Cannot see project $project_id as $account."
billing="$(gcloud billing projects describe "$project_id" --format='value(billingEnabled)' 2>/dev/null || echo unknown)"
[[ "$billing" == "False" ]] && die "Billing is not enabled on $project_id."
docker info >/dev/null 2>&1 || die "Docker is not running. Start Docker Desktop and try again."

say "Deploying to $project_id ($region) as $account${github_repo:+, CI deploys from $github_repo}"
approve=()
[[ "${YES:-}" == "1" ]] && approve=(-auto-approve)

# ---- 1. Bootstrap: APIs, image registry, keyless GitHub deploys ----
say "1/5  Bootstrap (APIs, registry, GitHub trust)"
terraform -chdir=infra/bootstrap init -input=false >/dev/null
terraform -chdir=infra/bootstrap apply ${approve[@]+"${approve[@]}"} -var="project_id=$project_id" -var="region=$region" -var="github_repository=$github_repo"
repository_url="$(terraform -chdir=infra/bootstrap output -raw repository_url)"
deployer="$(terraform -chdir=infra/bootstrap output -raw deployer_service_account)"

# ---- 2. Godot and the web export templates ----
say "2/5  Godot ${GODOT_VERSION:=4.5-stable} and its web templates"
cache="${XDG_CACHE_HOME:-$HOME/.cache}/sse-godot/$GODOT_VERSION"
release="https://github.com/godotengine/godot/releases/download/$GODOT_VERSION"
case "$(uname -s)" in
  Darwin)
    zip="Godot_v${GODOT_VERSION}_macos.universal.zip"; bin="$cache/Godot.app/Contents/MacOS/Godot"
    templates="$HOME/Library/Application Support/Godot/export_templates/${GODOT_VERSION/-/.}" ;;
  Linux)
    zip="Godot_v${GODOT_VERSION}_linux.x86_64.zip"; bin="$cache/Godot_v${GODOT_VERSION}_linux.x86_64"
    templates="${XDG_DATA_HOME:-$HOME/.local/share}/godot/export_templates/${GODOT_VERSION/-/.}" ;;
  *) die "Run this on macOS or Linux (or in WSL)." ;;
esac
bin="${GODOT:-$bin}"
if [[ ! -x "$bin" ]]; then
  mkdir -p "$cache"
  curl -fsSL -o "$cache/godot.zip" "$release/$zip"
  unzip -q -o "$cache/godot.zip" -d "$cache" && rm "$cache/godot.zip"
  chmod +x "$bin"
fi
if ! ls "$templates"/web_nothreads_release.zip >/dev/null 2>&1; then
  mkdir -p "$templates"
  curl -fsSL -o "$cache/templates.tpz" "$release/Godot_v${GODOT_VERSION}_export_templates.tpz"
  (cd "$templates" && unzip -o -q -j "$cache/templates.tpz" 'templates/web_*' 'templates/version.txt')
  rm "$cache/templates.tpz"
fi

# ---- 3. Export ----
say "3/5  Export the web build"
rm -rf build/web && mkdir -p build/web
"$bin" --headless --path godot --import >/dev/null 2>&1 || true   # the class cache, before the export
"$bin" --headless --path godot --export-release Web ../build/web/index.html
[[ -s build/web/index.pck && -s build/web/index.wasm ]] || die "The export did not produce index.pck and index.wasm."
# The soundtrack is left out of the pack and fetched from audio/ beside the page (Sound).
mkdir -p build/web/audio && cp godot/audio/piece_*.mp3 build/web/audio/

# ---- 4. Image ----
say "4/5  Build and push the image"
image_tag="$repository_url/expedition:$(git rev-parse --short=12 HEAD)"
gcloud auth configure-docker "$region-docker.pkg.dev" --quiet >/dev/null
docker buildx build --platform linux/amd64 -f Dockerfile.godot --tag "$image_tag" --push .
image_digest="$(gcloud artifacts docker images describe "$image_tag" --project="$project_id" --format='value(image_summary.digest)')"
[[ "$image_digest" =~ ^sha256:[a-f0-9]{64}$ ]] || die "Could not resolve an immutable image digest; no service changes applied."
image="$repository_url/expedition@$image_digest"

# ---- 5. Service ----
say "5/5  Cloud Run service salish-sea-expedition"
terraform -chdir=infra/service init -input=false >/dev/null
terraform -chdir=infra/service apply ${approve[@]+"${approve[@]}"} -var="project_id=$project_id" -var="region=$region" \
  -var="deployer_service_account=$deployer" -var="expedition_image=$image"
# Terraform sets the image only on first create; roll this one out on every run.
gcloud run deploy salish-sea-expedition --project "$project_id" --region "$region" --image "$image" --quiet >/dev/null
gcloud run services update-traffic salish-sea-expedition --project "$project_id" --region "$region" --to-latest --quiet >/dev/null
url="$(terraform -chdir=infra/service output -raw public_url)"
for _ in 1 2 3 4 5 6; do curl -fsS "$url/health" >/dev/null 2>&1 && break; sleep 5; done
curl -fsS "$url/health" >/dev/null || die "Deployed, but $url/health is not answering yet. Check: gcloud run services logs read salish-sea-expedition --region $region"
say "Live: $url   (add ?perf=1 for the go/no-go numbers on a phone; ?dev=1 for the Skip chip)"

# ---- GitHub: secrets for the deploy workflow ----
if [[ -n "$deployer" ]]; then
  provider="$(terraform -chdir=infra/bootstrap output -raw workload_identity_provider)"
  echo
  echo "For deploys from GitHub, add these repository secrets"
  echo "(Settings → Secrets and variables → Actions):"
  echo "  GCP_PROJECT      = $project_id"
  echo "  GCP_DEPLOY_SA    = $deployer"
  echo "  GCP_WIF_PROVIDER = $provider"
fi
