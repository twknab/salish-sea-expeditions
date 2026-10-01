# Bootstrap: APIs, the image registry and — optionally — keyless GitHub Actions deploys through
# Workload Identity Federation. Apply this first; the service root needs a pushed image.
terraform {
  required_version = ">= 1.6, < 2.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  description = "Existing GCP project with billing enabled."
  type        = string
}

variable "region" {
  description = "Region for the game and its image repository."
  type        = string
  default     = "us-west1"
}

variable "github_repository" {
  description = "owner/repo allowed to deploy from GitHub Actions (empty = no CI deploys)."
  type        = string
  default     = ""
  validation {
    condition     = var.github_repository == "" || can(regex("^[A-Za-z0-9-]+/[A-Za-z0-9._-]+$", var.github_repository))
    error_message = "Use the form owner/repo."
  }
}

locals {
  ci = var.github_repository != ""
}

resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
  ])
  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "game" {
  location      = var.region
  repository_id = "salish-sea-expeditions"
  description   = "Salish Sea Expeditions game images"
  format        = "DOCKER"

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }

  depends_on = [google_project_service.apis]
}

# --- Keyless deploys from GitHub Actions --------------------------------------------------------
# GitHub's OIDC token is exchanged for the deployer account; only the named repository may do so.

resource "google_iam_workload_identity_pool" "github" {
  count                     = local.ci ? 1 : 0
  workload_identity_pool_id = "sse-github"
  display_name              = "Salish Sea GitHub Actions"
  depends_on                = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  count                              = local.ci ? 1 : 0
  workload_identity_pool_id          = google_iam_workload_identity_pool.github[0].workload_identity_pool_id
  workload_identity_pool_provider_id = "sse-github-oidc"
  display_name                       = "GitHub OIDC"
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }
  attribute_condition = "assertion.repository == \"${var.github_repository}\""
  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account" "deployer" {
  count        = local.ci ? 1 : 0
  account_id   = "sse-deployer"
  display_name = "Salish Sea Expeditions deployer (GitHub Actions)"
}

resource "google_service_account_iam_member" "deployer_wif" {
  count              = local.ci ? 1 : 0
  service_account_id = google_service_account.deployer[0].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github[0].name}/attribute.repository/${var.github_repository}"
}

# Push images to this repository only.
resource "google_artifact_registry_repository_iam_member" "deployer_push" {
  count      = local.ci ? 1 : 0
  location   = google_artifact_registry_repository.game.location
  repository = google_artifact_registry_repository.game.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.deployer[0].email}"
}

# Deploy new revisions (cannot change IAM policy). Acting as the runtime account is granted in
# the service root, on that one account only.
resource "google_project_iam_member" "deployer_run" {
  count   = local.ci ? 1 : 0
  project = var.project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.deployer[0].email}"
}

output "repository_url" {
  description = "Push the linux/amd64 game image here before applying the service root."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.game.repository_id}"
}

output "deployer_service_account" {
  description = "Set as the GCP_DEPLOY_SA repository secret, and pass to the service root."
  value       = local.ci ? google_service_account.deployer[0].email : ""
}

output "workload_identity_provider" {
  description = "Set as the GCP_WIF_PROVIDER repository secret."
  value       = local.ci ? google_iam_workload_identity_pool_provider.github[0].name : ""
}
