# Host Salish Sea Expeditions on Google Cloud Run

The game is a static web app: a tiny Node server (`server/server.mjs`) serves the Godot web export
with brotli and gzip, long-lived caching for hashed assets and a `/health` check. Saves live on each
player's phone, so there is no database and the runtime service account has **no project roles**.
Defaults: Oregon (`us-west1`), scale to zero, at most three instances, 1 CPU and 256 MiB. Registry
storage and Cloud Run usage can cost money; the instance limit is not a billing cap.

## First deployment (from your machine)

Prerequisites: Terraform ≥ 1.6, Docker running (Buildx), the Google Cloud CLI logged in, and
`curl`, `unzip` and `git`. Never commit credentials:

```sh
gcloud auth login
gcloud auth application-default login
gcloud config set project twk-experiments
```

From the repository root:

```sh
bash deploy/godot-cloud-run.sh            # current gcloud project, us-west1, this GitHub repo
bash deploy/godot-cloud-run.sh twk-experiments us-west1 twknab/salish-sea-expeditions   # explicit
YES=1 bash deploy/godot-cloud-run.sh      # approve the Terraform plans automatically
```

It checks your login, project, billing and Docker first, then:

1. applies `infra/bootstrap` — APIs, the image registry, and keyless GitHub deploys for the repo;
2. fetches Godot 4.5 and its web export templates (cached under `~/.cache/sse-godot`; set
   `GODOT=/path/to/godot` to use your own);
3. exports `build/web`, with the four soundtrack pieces beside it in `audio/`;
4. builds and pushes a linux/amd64 image from `Dockerfile.godot` (which precompresses the export
   with brotli and gzip, `server/precompress.mjs`) and resolves its digest;
5. applies `infra/service` — the public Cloud Run service — rolls out that image, waits for
   `/health`, and prints the URL.

It finishes by printing the three repository secrets the deploy workflow needs. Two Terraform roots
avoid the first-deploy trap: Cloud Run cannot start before an image exists. Safe to re-run for each
new build.

## CI/CD

| Stage | Workflow | When | What |
|---|---|---|---|
| Pre-merge | `Godot` (`godot.yml`) | pull requests touching `godot/**`, `server/**`, `tools/**`, `src/content/**` | GDScript lint, `godot/content` freshness, headless unit tests, every scene instantiated headless, the web export, the bare page in headless Chromium on a desktop window and on a phone (screenshots kept 7 days), every station from its check URL, and a build of `Dockerfile.godot` answering `/health` |
| Pre-merge | `Checks` (`ci.yml`) | pull requests touching the shared JavaScript, the server or the infrastructure | tests (simulation, content, server), server syntax, dependency audit, Terraform fmt and validation |
| Deploy | `Deploy (post-merge)` (`deploy.yml`) | by hand (`workflow_dispatch`) | exports the Godot build, builds `Dockerfile.godot`, pushes it to the `expedition` image, rolls it out to the `salish-sea-expedition` service and checks `/health` |

Deploys need the three secrets (`GCP_PROJECT`, `GCP_DEPLOY_SA`, `GCP_WIF_PROVIDER`) and do nothing
until they exist. No keys are stored anywhere: GitHub's OIDC token is exchanged for the deployer
account, which is locked to this repository and can only push to this registry, deploy Cloud Run
revisions and act as the runtime account; it cannot change IAM. Forked pull requests get checks,
never deploys. Optionally add required reviewers to the `production` environment in GitHub to gate
deploys by hand.

Terraform ignores the service's image and traffic after the first apply (CI owns rollouts), so a
later `terraform apply` never rolls the game back.

## The retired Phaser build

The game was a Phaser 4 + three.js web app until the Godot rewrite replaced it. Its sources, its
`Dockerfile`, its Vite build, its `Preview` workflow and its Cloud Run service are gone. The two
services were named a letter apart while both ran — `salish-sea-expeditions` (plural) was Phaser,
`salish-sea-expedition` (singular) is the game — which is worth knowing when reading older logs.

**The first `terraform apply` after this change destroys the old service.** Read the plan before
approving it: it should show exactly one destroy, `google_cloud_run_v2_service.game`, and nothing
else. Its image stays in the registry until you delete it.

The `phaser-final` tag is the last commit with that build intact:

```sh
git show phaser-final --stat        # what it was
git checkout phaser-final           # or recover a single file from it
```

What stayed, because the Godot build needs it: `src/content/` and `src/sim/` (the content and the
rules `tools/export-content.mjs` generates `godot/content` from — `godot.yml` fails if it is stale),
`tools/`, `server/`, and the tests for all three.

## Custom domain (optional)

Verify the domain in Google Search Console, then apply `infra/service` with
`-var="domain=salish.timknab.dev"` and create the DNS records from the `dns_records` output. The
mapping points at the game's service.

## Verify

```sh
URL="$(terraform -chdir=infra/service output -raw public_url)"
curl --fail "$URL/health"
```

Then open the URL on an iPhone: play through Boat School, and use Share → Add to Home Screen. Add
`?perf=1` for the go/no-go frame-rate numbers, `?dev=1` for a Skip chip on every screen.

Note: the Godot export has `progressive_web_app/enabled=false`, so there is no web manifest or
service worker — Add to Home Screen gives an icon and a launcher, not standalone display or offline
play. The Phaser build carried a hand-written manifest and service worker in `public/`; they went
with it (see `phaser-final`). Turning the export's own PWA on is the way back, not restoring those.

## State

State is local by default and git-ignored; back it up. Before collaborating or applying from CI,
move both roots to a GCS backend with separate prefixes. Commit the generated
`.terraform.lock.hcl` files.

## Remove

Review the destroy plans, then destroy `infra/service` first and `infra/bootstrap` second.
