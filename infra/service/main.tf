# Service: the public Cloud Run service. Needs an image already pushed (see ../bootstrap).
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
  type        = string
  description = "Existing project initialised by ../bootstrap."
}

variable "region" {
  type    = string
  default = "us-west1"
}

variable "image" {
  type        = string
  description = "Initial game image, as an immutable digest. Later images are rolled out by CI."
  validation {
    condition     = can(regex("@sha256:[a-f0-9]{64}$", var.image))
    error_message = "Provide an immutable image URL ending in @sha256:<64 hex characters>."
  }
}

variable "max_instances" {
  type    = number
  default = 3
  validation {
    condition     = var.max_instances >= 1 && var.max_instances <= 10 && floor(var.max_instances) == var.max_instances
    error_message = "Choose an integer between 1 and 10."
  }
}

variable "deployer_service_account" {
  type        = string
  description = "Deployer account from ../bootstrap (empty if CI deploys are not used)."
  default     = ""
}

variable "expedition_image" {
  type        = string
  description = "Image for the Godot build (Dockerfile.godot), as an immutable digest. Empty until that service is turned on; see infra/README.md."
  default     = ""
  validation {
    condition     = var.expedition_image == "" || can(regex("@sha256:[a-f0-9]{64}$", var.expedition_image))
    error_message = "Provide an immutable image URL ending in @sha256:<64 hex characters>, or leave empty."
  }
}

variable "domain" {
  type        = string
  description = "Optional custom domain, e.g. salish.timknab.dev (must be verified in Search Console first)."
  default     = ""
}

resource "google_service_account" "game" {
  account_id   = "sse-runtime"
  display_name = "Salish Sea Expeditions runtime"
  # A static game: no project roles, no credentials.
}

# The deployer may act as this runtime account (and only this one) when rolling out revisions.
resource "google_service_account_iam_member" "deployer_act_as" {
  count              = var.deployer_service_account != "" ? 1 : 0
  service_account_id = google_service_account.game.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${var.deployer_service_account}"
}

resource "google_cloud_run_v2_service" "game" {
  name                 = "salish-sea-expeditions"
  location             = var.region
  deletion_protection  = false
  ingress              = "INGRESS_TRAFFIC_ALL"
  invoker_iam_disabled = true

  template {
    service_account                  = google_service_account.game.email
    max_instance_request_concurrency = 80
    timeout                          = "60s"

    scaling {
      min_instance_count = 0
      max_instance_count = var.max_instances
    }

    containers {
      image = var.image
      ports {
        container_port = 8080
      }
      resources {
        limits = {
          cpu    = "1"
          memory = "256Mi"
        }
        cpu_idle          = true
        startup_cpu_boost = false
      }
      startup_probe {
        initial_delay_seconds = 0
        timeout_seconds       = 1
        period_seconds        = 3
        failure_threshold     = 10
        http_get {
          path = "/health"
          port = 8080
        }
      }
    }
  }

  # CI rolls out new images and owns traffic (production follows the newest revision; pull-request
  # previews are tagged revisions with no traffic). Terraform owns everything else.
  lifecycle {
    ignore_changes = [template[0].containers[0].image, client, client_version, traffic]
  }
}

resource "google_cloud_run_domain_mapping" "game" {
  count    = var.domain != "" ? 1 : 0
  location = var.region
  name     = var.domain
  metadata {
    namespace = var.project_id
  }
  spec {
    route_name = google_cloud_run_v2_service.game.name
  }
}

# The Godot rewrite ships as a second service beside the first game, so both can be played and
# compared until one replaces the other. It is framed here and created only once an image exists
# (`expedition_image`); until then `terraform plan` shows nothing for it and the deploy workflow's
# `expedition` job skips. Same runtime account, same limits, same hands-off rollout contract.
resource "google_cloud_run_v2_service" "expedition" {
  count                = var.expedition_image != "" ? 1 : 0
  name                 = "salish-sea-expedition"
  location             = var.region
  deletion_protection  = false
  ingress              = "INGRESS_TRAFFIC_ALL"
  invoker_iam_disabled = true

  template {
    service_account                  = google_service_account.game.email
    max_instance_request_concurrency = 80
    timeout                          = "60s"

    scaling {
      min_instance_count = 0
      max_instance_count = var.max_instances
    }

    containers {
      image = var.expedition_image
      ports {
        container_port = 8080
      }
      resources {
        limits = {
          cpu    = "1"
          memory = "256Mi"
        }
        cpu_idle          = true
        startup_cpu_boost = false
      }
      startup_probe {
        initial_delay_seconds = 0
        timeout_seconds       = 1
        period_seconds        = 3
        failure_threshold     = 10
        http_get {
          path = "/health"
          port = 8080
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].containers[0].image, client, client_version, traffic]
  }
}

output "expedition_url" {
  description = "The Godot build's URL, once that service exists."
  value       = var.expedition_image != "" ? google_cloud_run_v2_service.expedition[0].uri : ""
}

output "public_url" {
  description = "Open this HTTPS URL on a phone to play."
  value       = google_cloud_run_v2_service.game.uri
}

output "dns_records" {
  description = "DNS records to create for the custom domain, if one was given."
  value       = var.domain != "" ? google_cloud_run_domain_mapping.game[0].status[0].resource_records : []
}
