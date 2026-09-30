#!/usr/bin/env bash
set -euo pipefail

# Usage: bash deploy/cloud-run.sh PROJECT_ID [REGION] [GITHUB_REPO]
# Terraform shows each plan and asks before applying. Re-run any time to redeploy.
project_id="${1:?Usage: bash deploy/cloud-run.sh PROJECT_ID [REGION] [GITHUB_REPO]}"
region="${2:-us-west1}"
github_repo="${3:-}"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

for tool in terraform gcloud docker; do
  command -v "$tool" >/dev/null || { echo "Install $tool first." >&2; exit 1; }
done
docker info >/dev/null

terraform -chdir=infra/bootstrap init
terraform -chdir=infra/bootstrap apply -var="project_id=$project_id" -var="region=$region" -var="github_repository=$github_repo"
repository_url="$(terraform -chdir=infra/bootstrap output -raw repository_url)"
deployer="$(terraform -chdir=infra/bootstrap output -raw deployer_service_account)"
image_tag="$repository_url/game:$(date -u +%Y%m%d%H%M%S)"

gcloud auth configure-docker "$region-docker.pkg.dev" --quiet
docker buildx build --platform linux/amd64 --tag "$image_tag" --push .
image_digest="$(gcloud artifacts docker images describe "$image_tag" --project="$project_id" --format='value(image_summary.digest)')"
if [[ ! "$image_digest" =~ ^sha256:[a-f0-9]{64}$ ]]; then
  echo "Could not resolve an immutable image digest; no service changes applied." >&2
  exit 1
fi

terraform -chdir=infra/service init
terraform -chdir=infra/service apply -var="project_id=$project_id" -var="region=$region" \
  -var="image=$repository_url/game@$image_digest" -var="deployer_service_account=$deployer"
url="$(terraform -chdir=infra/service output -raw public_url)"
echo
echo "Play: $url"
if [[ -n "$deployer" ]]; then
  echo
  echo "For deploys on every merge, add these GitHub repository secrets:"
  echo "  GCP_PROJECT      = $project_id"
  echo "  GCP_DEPLOY_SA    = $deployer"
  echo "  GCP_WIF_PROVIDER = $(terraform -chdir=infra/bootstrap output -raw workload_identity_provider)"
fi
