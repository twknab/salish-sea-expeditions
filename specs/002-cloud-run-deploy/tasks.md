# Tasks: Deploy to Cloud Run

- [x] T001 `server/server.mjs` + `tests/server.test.js` (health, gzip, caching, traversal, fallback)
- [x] T002 `Dockerfile`, `.dockerignore`, `.gcloudignore`; build and run the container locally
- [x] T003 `infra/bootstrap/main.tf` (APIs, Artifact Registry, optional WIF + deployer SA)
- [x] T004 `infra/service/main.tf` (runtime SA, Cloud Run v2 service, optional domain mapping)
- [x] T005 `deploy/cloud-run.sh` and `infra/README.md`
- [x] T006 `.github/workflows/ci.yml` (test, build, server check, audit, terraform fmt/validate)
- [x] T007 `.github/workflows/deploy.yml` (after CI on main; keyless; skip stale commits; smoke)
- [x] T008 README deploy section
