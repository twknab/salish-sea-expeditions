#!/usr/bin/env bash
# Deploy Salish Sea Expeditions to Cloud Run, from your own machine, in one command:
#
#   bash deploy/cloud-run.sh [PROJECT_ID] [REGION] [GITHUB_REPO]
#
# Defaults: your current gcloud project, us-west1, and this checkout's GitHub repository (which
# also sets up keyless deploys from GitHub Actions). Terraform shows each plan and asks before
# applying; pass YES=1 to approve automatically. Safe to re-run: it rolls out a fresh image.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
die() { printf '\n\033[31m%s\033[0m\n' "$*" >&2; exit 1; }

# ---- Preflight: tools, login, project, Docker ----
for tool in terraform gcloud docker; do
  command -v "$tool" >/dev/null || die "Install $tool first (see infra/README.md)."
done
project_id="${1:-$(gcloud config get-value project 2>/dev/null || true)}"
[[ -n "$project_id" ]] || die "No project given and none set: bash deploy/cloud-run.sh YOUR_PROJECT_ID"
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
say "1/3  Bootstrap (APIs, registry, GitHub trust)"
terraform -chdir=infra/bootstrap init -input=false >/dev/null
terraform -chdir=infra/bootstrap apply ${approve[@]+"${approve[@]}"} -var="project_id=$project_id" -var="region=$region" -var="github_repository=$github_repo"
repository_url="$(terraform -chdir=infra/bootstrap output -raw repository_url)"
deployer="$(terraform -chdir=infra/bootstrap output -raw deployer_service_account)"

# ---- 2. Build and push an immutable image ----
say "2/3  Build and push the game image"
image_tag="$repository_url/game:$(git rev-parse --short=12 HEAD 2>/dev/null || date -u +%Y%m%d%H%M%S)"
gcloud auth configure-docker "$region-docker.pkg.dev" --quiet >/dev/null
docker buildx build --platform linux/amd64 --tag "$image_tag" --push .
image_digest="$(gcloud artifacts docker images describe "$image_tag" --project="$project_id" --format='value(image_summary.digest)')"
[[ "$image_digest" =~ ^sha256:[a-f0-9]{64}$ ]] || die "Could not resolve an immutable image digest; no service changes applied."
image="$repository_url/game@$image_digest"

# ---- 3. The public Cloud Run service ----
say "3/3  Cloud Run service"
terraform -chdir=infra/service init -input=false >/dev/null
terraform -chdir=infra/service apply ${approve[@]+"${approve[@]}"} -var="project_id=$project_id" -var="region=$region" \
  -var="image=$image" -var="deployer_service_account=$deployer"
# Terraform sets the image only on first create; roll this one out on every run.
gcloud run deploy salish-sea-expeditions --project "$project_id" --region "$region" --image "$image" --quiet >/dev/null
gcloud run services update-traffic salish-sea-expeditions --project "$project_id" --region "$region" --to-latest --quiet >/dev/null
url="$(terraform -chdir=infra/service output -raw public_url)"

for _ in 1 2 3 4 5 6; do curl -fsS "$url/health" >/dev/null 2>&1 && break; sleep 5; done
curl -fsS "$url/health" >/dev/null || die "Deployed, but $url/health is not answering yet. Check: gcloud run services logs read salish-sea-expeditions --region $region"
say "Live: $url"

# ---- GitHub: secrets for the pre-merge preview and post-merge deploy workflows ----
if [[ -n "$deployer" ]]; then
  provider="$(terraform -chdir=infra/bootstrap output -raw workload_identity_provider)"
  if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
    read -r -p "Set the three deploy secrets on $github_repo with gh now? [y/N] " ans
    if [[ "$ans" =~ ^[Yy]$ ]]; then
      gh secret set GCP_PROJECT --repo "$github_repo" --body "$project_id"
      gh secret set GCP_DEPLOY_SA --repo "$github_repo" --body "$deployer"
      gh secret set GCP_WIF_PROVIDER --repo "$github_repo" --body "$provider"
      say "Done: pull requests now get previews, and merges to main deploy."
      exit 0
    fi
  fi
  echo
  echo "For previews and deploys from GitHub, add these repository secrets"
  echo "(Settings → Secrets and variables → Actions):"
  echo "  GCP_PROJECT      = $project_id"
  echo "  GCP_DEPLOY_SA    = $deployer"
  echo "  GCP_WIF_PROVIDER = $provider"
fi
