#!/usr/bin/env bash
# Deploy the Godot build — the `salish-sea-expedition` Cloud Run service — from your own machine:
#
#   bash deploy/godot-cloud-run.sh [PROJECT_ID] [REGION]
#
# Run deploy/cloud-run.sh once first, from this checkout: it creates the registry, the deployer and
# the first game's service, and leaves the Terraform state this script reads. Then this script:
#   1. fetches Godot 4.5 and its web export templates (cached; GODOT=/path/to/godot uses yours),
#   2. exports the web build into build/web, with the four soundtrack pieces beside it in audio/,
#   3. builds Dockerfile.godot for linux/amd64, pushes it and resolves its digest,
#   4. applies infra/service with that digest (creates the public service the first time) and rolls
#      the image out, waits for /health, and prints the URL.
# Terraform shows its plan and asks before applying; YES=1 approves automatically. Safe to re-run.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
die() { printf '\n\033[31m%s\033[0m\n' "$*" >&2; exit 1; }

# ---- Preflight ----
for tool in terraform gcloud docker curl unzip git; do
  command -v "$tool" >/dev/null || die "Install $tool first (see infra/README.md)."
done
project_id="${1:-$(gcloud config get-value project 2>/dev/null || true)}"
[[ -n "$project_id" ]] || die "No project given and none set: bash deploy/godot-cloud-run.sh YOUR_PROJECT_ID"
region="${2:-us-west1}"
account="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | head -1)"
[[ -n "$account" ]] || die "Not logged in: gcloud auth login"
gcloud auth application-default print-access-token >/dev/null 2>&1 \
  || die "Terraform needs application-default credentials: gcloud auth application-default login"
docker info >/dev/null 2>&1 || die "Docker is not running. Start Docker Desktop and try again."
[[ -f infra/bootstrap/terraform.tfstate ]] \
  || die "No bootstrap state in this checkout: run bash deploy/cloud-run.sh $project_id $region first."
phaser_image="$(gcloud run services describe salish-sea-expeditions --project "$project_id" --region "$region" \
  --format='value(spec.template.spec.containers[0].image)' 2>/dev/null || true)"
[[ "$phaser_image" =~ @sha256:[a-f0-9]{64}$ ]] \
  || die "The first game's service is not there (or not on a digest): run bash deploy/cloud-run.sh $project_id $region first."
say "Deploying the Godot build to $project_id ($region) as $account"
approve=()
[[ "${YES:-}" == "1" ]] && approve=(-auto-approve)

# ---- 1. Godot and the web export templates ----
say "1/4  Godot ${GODOT_VERSION:=4.5-stable} and its web templates"
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

# ---- 2. Export ----
say "2/4  Export the web build"
rm -rf build/web && mkdir -p build/web
"$bin" --headless --path godot --import >/dev/null 2>&1 || true   # the class cache, before the export
"$bin" --headless --path godot --export-release Web ../build/web/index.html
[[ -s build/web/index.pck && -s build/web/index.wasm ]] || die "The export did not produce index.pck and index.wasm."
# The soundtrack is left out of the pack and fetched from audio/ beside the page (Sound).
mkdir -p build/web/audio && cp godot/audio/piece_*.mp3 build/web/audio/

# ---- 3. Image ----
say "3/4  Build and push the image"
repository_url="$(terraform -chdir=infra/bootstrap output -raw repository_url)"
deployer="$(terraform -chdir=infra/bootstrap output -raw deployer_service_account)"
image_tag="$repository_url/expedition:$(git rev-parse --short=12 HEAD)"
gcloud auth configure-docker "$region-docker.pkg.dev" --quiet >/dev/null
docker buildx build --platform linux/amd64 -f Dockerfile.godot --tag "$image_tag" --push .
image_digest="$(gcloud artifacts docker images describe "$image_tag" --project="$project_id" --format='value(image_summary.digest)')"
[[ "$image_digest" =~ ^sha256:[a-f0-9]{64}$ ]] || die "Could not resolve an immutable image digest; no service changes applied."
image="$repository_url/expedition@$image_digest"

# ---- 4. Service ----
say "4/4  Cloud Run service salish-sea-expedition"
terraform -chdir=infra/service init -input=false >/dev/null
terraform -chdir=infra/service apply ${approve[@]+"${approve[@]}"} -var="project_id=$project_id" -var="region=$region" \
  -var="image=$phaser_image" -var="deployer_service_account=$deployer" -var="expedition_image=$image"
# Terraform sets the image only on first create; roll this one out on every run.
gcloud run deploy salish-sea-expedition --project "$project_id" --region "$region" --image "$image" --quiet >/dev/null
gcloud run services update-traffic salish-sea-expedition --project "$project_id" --region "$region" --to-latest --quiet >/dev/null
url="$(terraform -chdir=infra/service output -raw expedition_url)"
for _ in 1 2 3 4 5 6; do curl -fsS "$url/health" >/dev/null 2>&1 && break; sleep 5; done
curl -fsS "$url/health" >/dev/null || die "Deployed, but $url/health is not answering yet. Check: gcloud run services logs read salish-sea-expedition --region $region"
say "Live: $url   (add ?perf=1 for the go/no-go numbers on a phone; ?dev=1 for the Skip chip)"
