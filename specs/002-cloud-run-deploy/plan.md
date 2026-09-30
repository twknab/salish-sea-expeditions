# Implementation Plan: Deploy to Cloud Run

**Branch**: `claude/game-concept-discussion-uuwa07` | **Date**: 2026-09-30 | **Spec**: [spec.md](spec.md)

## Summary

Reuse the proven Plumber Wars shape: `server/server.mjs` (static, gzip, health), a two-stage
`Dockerfile`, Terraform in `infra/bootstrap` and `infra/service`, `deploy/cloud-run.sh`, and GitHub
Actions for CI and keyless deploy. The one addition: bootstrap also creates the Workload Identity
Federation pool, provider and deployer account (Plumber Wars set these up by hand), so the whole
path is Terraform (Principle IX).

## Technical Context

**Language**: Node 22 (server, no dependencies); Terraform ≥ 1.6 with `hashicorp/google ~> 7.0`
**Target**: Google Cloud Run (us-west1), Artifact Registry, GitHub Actions
**Testing**: `node:test` for the server (health, headers, traversal, fallback); container built and
exercised locally; `terraform fmt -check` (provider registry unreachable from the build
environment, so `terraform validate` runs in CI instead)

## Constitution Check

| Principle | Status |
| --- | --- |
| VII Mobile-first | Pass — HTTPS URL, PWA headers, offline via service worker |
| IX Simple, testable, deployable | Pass — Terraform-only infra, keyless CI, no secrets |
| VIII Legally sourced | Pass — no new assets |

## Structure

```text
server/server.mjs            static server
Dockerfile, .dockerignore, .gcloudignore
infra/bootstrap/main.tf      APIs, registry, WIF + deployer (optional)
infra/service/main.tf        runtime SA, Cloud Run service, optional domain mapping
infra/README.md
deploy/cloud-run.sh
.github/workflows/ci.yml, deploy.yml
tests/server.test.js
```
