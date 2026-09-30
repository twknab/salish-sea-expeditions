# Feature Specification: Play it on a phone — deploy to Cloud Run

**Feature Branch**: `claude/game-concept-discussion-uuwa07`

**Created**: 2026-09-30

**Status**: Implemented — awaiting the owner's first `terraform apply` (needs their GCP project)

**Input**: "Web deployed, the same way we did Plumber Wars — Terraform for a Cloud Run instance."

**Constitution principles served** (v1.1.0): VII (mobile-first: a real HTTPS URL to open on an
iPhone and install to the home screen), IX (infrastructure as Terraform, no secrets in source).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open the game on an iPhone from a link (Priority: P1)

The owner shares a link; a sea kayaker opens it in Safari, plays, and adds it to the home screen.

**Independent Test**: Open the public URL on a phone; the title screen loads over HTTPS in under
three seconds on a good connection, and "Add to Home Screen" gives a full-screen app with the real
icon.

**Acceptance Scenarios**:

1. **Given** the service is deployed, **When** someone opens the URL, **Then** the game loads over
   HTTPS with compressed, long-cached assets.
2. **Given** the game has loaded once, **When** the phone goes offline, **Then** the game still
   opens and plays (saves are on the device).
3. **Given** a health check, **When** `/health` is requested, **Then** it answers `ok`.

### User Story 2 - The owner deploys with one command (Priority: P1)

**Independent Test**: With a GCP project, Docker and the Google Cloud CLI, `bash deploy/cloud-run.sh
PROJECT_ID` enables the APIs, creates the image registry, builds and pushes the image, and creates
the public service, asking for approval before each Terraform apply, and prints the URL.

### User Story 3 - Every merge to main ships itself (Priority: P2)

**Independent Test**: After the one-time keyless GitHub → Google trust is set up (Terraform
creates it), a green CI run on `main` deploys and smoke-tests the live URL.

### Edge Cases

- First deploy: Cloud Run cannot start before an image exists — two Terraform roots (bootstrap,
  service) avoid a placeholder service.
- Path traversal on the static server is refused; unknown paths fall back to the game.
- An old commit finishing CI late must not overwrite a newer deploy.

## Requirements *(mandatory)*

- **FR-001**: A dependency-free Node server MUST serve the built game with gzip, immutable caching
  for hashed assets, `no-cache` for HTML and the service worker, security headers, and `/health`.
- **FR-002**: A multi-stage container MUST build the game and run the server as a non-root user
  on port 8080.
- **FR-003**: Terraform MUST create, per the Plumber Wars pattern, a bootstrap root (APIs, Artifact
  Registry, and — when a GitHub repository is given — Workload Identity Federation and a deployer
  service account limited to that repository) and a service root (runtime service account with no
  roles, public Cloud Run service from an immutable image digest, scale to zero, max 3 instances).
- **FR-004**: No credentials, project IDs or state files in the repository.
- **FR-005**: CI MUST run tests, build, the server syntax check and an audit on every push and
  pull request; deploy MUST run only after CI passes on `main`, using keyless auth.
- **FR-006**: An optional custom domain (for example on timknab.dev) MUST be possible via a
  variable, without being required.

## Success Criteria *(mandatory)*

- **SC-001**: A first deploy takes one command and under 15 minutes of wall time.
- **SC-002**: Idle cost is zero instances; the public URL answers `/health` within 5 seconds of a
  cold start.
- **SC-003**: The game scores 100% installable (manifest, icons, service worker) in Chrome's
  Lighthouse PWA check.

## Assumptions

- The owner supplies a GCP project with billing; state is local by default (a GCS backend is
  documented for collaboration), as in Plumber Wars.
- No leaderboard or server data in this feature; the service account has no project roles.
