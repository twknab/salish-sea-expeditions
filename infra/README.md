# Host Salish Sea Expeditions on Google Cloud Run

The game is a static web app: a tiny Node server (`server/server.mjs`) serves the build with gzip,
long-lived caching for hashed assets and a `/health` check. Saves live on each player's phone, so
there is no database and the runtime service account has **no project roles**. Defaults: Oregon
(`us-west1`), scale to zero, at most three instances, 1 CPU and 256 MiB. Registry storage and
Cloud Run usage can cost money; the instance limit is not a billing cap.

## First deployment

Prerequisites: a GCP project with billing, Terraform ≥ 1.6, Docker with Buildx, and the Google
Cloud CLI. Authenticate locally — never commit credentials:

```sh
gcloud auth login
gcloud auth application-default login
```

From the repository root:

```sh
bash deploy/cloud-run.sh YOUR_PROJECT_ID us-west1 twknab/salish-sea-expeditions
```

It applies `infra/bootstrap` (APIs, the image registry, and keyless GitHub deploys for the named
repository), builds and pushes a linux/amd64 image, resolves its immutable digest, applies
`infra/service` (the public Cloud Run service) and prints the URL. Leave the third argument off to
skip CI deploys. Two Terraform roots avoid the first-deploy trap: Cloud Run cannot start before an
image exists.

## Deploy on every merge

The script prints three values; add them as GitHub repository secrets (Settings → Secrets and
variables → Actions): `GCP_PROJECT`, `GCP_DEPLOY_SA`, `GCP_WIF_PROVIDER`. From then on, when CI
passes on `main`, `.github/workflows/deploy.yml` builds the image, pushes it and rolls out a new
revision — no keys stored anywhere. The deployer can push to this one registry, deploy Cloud Run
revisions and act as this one runtime account; it cannot change IAM.

Terraform ignores the service's image after the first apply (CI owns rollouts), so a later
`terraform apply` never rolls the game back.

## Custom domain (optional)

Verify the domain in Google Search Console, then apply `infra/service` with
`-var="domain=salish.timknab.dev"` and create the DNS records from the `dns_records` output.

## Verify

```sh
URL="$(terraform -chdir=infra/service output -raw public_url)"
curl --fail "$URL/health"
```

Then open the URL on an iPhone: play through Boat School, and use Share → Add to Home Screen.

## State

State is local by default and git-ignored; back it up. Before collaborating or applying from CI,
move both roots to a GCS backend with separate prefixes. Commit the generated
`.terraform.lock.hcl` files.

## Remove

Review the destroy plans, then destroy `infra/service` first and `infra/bootstrap` second.
