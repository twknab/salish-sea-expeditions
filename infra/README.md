# Host Salish Sea Expeditions on Google Cloud Run

The game is a static web app: a tiny Node server (`server/server.mjs`) serves the build with gzip,
long-lived caching for hashed assets and a `/health` check. Saves live on each player's phone, so
there is no database and the runtime service account has **no project roles**. Defaults: Oregon
(`us-west1`), scale to zero, at most three instances, 1 CPU and 256 MiB. Registry storage and
Cloud Run usage can cost money; the instance limit is not a billing cap.

## First deployment (from your machine)

Prerequisites: Terraform ≥ 1.6, Docker running (Buildx), and the Google Cloud CLI, logged in.
Never commit credentials:

```sh
gcloud auth login
gcloud auth application-default login
gcloud config set project twk-experiments
```

From the repository root:

```sh
bash deploy/cloud-run.sh            # current gcloud project, us-west1, this GitHub repo
bash deploy/cloud-run.sh twk-experiments us-west1 twknab/salish-sea-expeditions   # explicit
YES=1 bash deploy/cloud-run.sh      # approve the Terraform plans automatically
```

It checks your login, project, billing and Docker first, then:

1. applies `infra/bootstrap` — APIs, the image registry, and keyless GitHub deploys for the repo;
2. builds and pushes a linux/amd64 image tagged with the commit, and resolves its digest;
3. applies `infra/service` — the public Cloud Run service — rolls out that image, waits for
   `/health`, and prints the URL.

If the GitHub CLI is logged in, it offers to set the three repository secrets for you. Two
Terraform roots avoid the first-deploy trap: Cloud Run cannot start before an image exists.

## CI/CD: pre-merge and post-merge

| Stage | Workflow | When | What |
|---|---|---|---|
| Pre-merge | `Checks` (`ci.yml`) | every pull request, and `main` | tests, build, every scene in headless Chromium (screenshots kept 7 days), server check, audit, Terraform fmt/validate |
| Pre-merge | `Preview` (`preview.yml`) | pull requests from this repo | builds the PR, deploys a **no-traffic** revision tagged `pr-<n>`, posts its private URL on the PR; removes the tag when the PR closes |
| Post-merge | `Deploy (post-merge)` (`deploy.yml`) | `Checks` passed on `main` | builds, pushes, rolls out to production (all traffic), checks `/health`; skips if a newer commit is already on `main` |
| Pre-merge | `Godot` (`godot.yml`) | pull requests and `main` touching `godot/**` | GDScript lint, content tests, headless unit tests, every scene instantiated headless, the web export, the bare page in headless Chromium on a desktop window and on a phone (screenshots kept 7 days), and a build of `Dockerfile.godot` answering `/health` |
| Post-merge | `Deploy (post-merge)` → `expedition` job | as above, **and** the repository variable `EXPEDITION_DEPLOY` is `true` | exports the Godot build, builds `Dockerfile.godot` (which precompresses the export with brotli and gzip, `server/precompress.mjs`), pushes it to the `expedition` image and rolls it out to the `salish-sea-expedition` service, checks `/health` |

Previews and deploys need the three secrets (`GCP_PROJECT`, `GCP_DEPLOY_SA`, `GCP_WIF_PROVIDER`)
and do nothing until they exist. No keys are stored anywhere: GitHub's OIDC token is exchanged for
the deployer account, which is locked to this repository and can only push to this registry,
deploy Cloud Run revisions and act as the runtime account; it cannot change IAM. Forked pull
requests get checks, never previews. Optionally add required reviewers to the `production`
environment in GitHub to gate deploys by hand.

Terraform ignores the service's image and traffic after the first apply (CI owns rollouts and
preview tags), so a later `terraform apply` never rolls the game back or removes a preview.

## The Godot build: a second service, framed and off

The rewrite on `experiment/godot-rewrite` ships as its own Cloud Run service, `salish-sea-expedition`,
beside the first game, so both can be played and compared until one replaces the other. Everything
is in place and nothing is created until it is switched on:

1. `infra/service` has the service behind `expedition_image` (empty by default, so `terraform plan`
   shows nothing for it). Turn it on with the first image's digest:
   `terraform apply -var="expedition_image=us-west1-docker.pkg.dev/<project>/salish-sea-expeditions/expedition@sha256:…"`.
   The image is built with `docker build -f Dockerfile.godot .` after a web export into `build/web`
   (the `Godot` workflow's artifact is exactly that).
2. Set the repository variable `EXPEDITION_DEPLOY=true`. From then on every merge to `main` that
   passes `Checks` exports, builds, pushes and rolls out the Godot build too.

The deploy job needs the same three secrets as the first game and nothing else; the deployer can
already push to the registry and deploy revisions, and the service uses the same runtime account.

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
