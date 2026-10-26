# Service: the public Cloud Run service for the game (the Godot build). Needs an image already
# pushed (see ../bootstrap).
#
# The Phaser build's service lived here too, until it was retired in favour of the Godot rewrite.
# Removing it from this file is what takes it down: the next apply destroys `salish-sea-expeditions`.
# The `phaser-final` tag is the commit where that build was last intact.
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

# Named for the service it fills (`salish-sea-expedition`), which keeps its name because renaming a
# Cloud Run service destroys and recreates it, and the URL people have would change with it.
variable "expedition_image" {
  type        = string
  description = "The game's image (Dockerfile.godot), as an immutable digest. Empty before the first one is pushed: Cloud Run cannot create a service without an image, which is why this is gated."
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

  # CI rolls out new images and owns traffic (production follows the newest revision). Terraform
  # owns everything else, so a later apply never rolls the game back.
  lifecycle {
    ignore_changes = [template[0].containers[0].image, client, client_version, traffic]
  }
}

resource "google_cloud_run_domain_mapping" "game" {
  count    = var.domain != "" && var.expedition_image != "" ? 1 : 0
  location = var.region
  name     = var.domain
  metadata {
    namespace = var.project_id
  }
  spec {
    route_name = google_cloud_run_v2_service.expedition[0].name
  }
}

output "public_url" {
  description = "Open this HTTPS URL on a phone to play."
  value       = var.expedition_image != "" ? google_cloud_run_v2_service.expedition[0].uri : ""
}

output "dns_records" {
  description = "DNS records to create for the custom domain, if one was given."
  value       = var.domain != "" && var.expedition_image != "" ? google_cloud_run_domain_mapping.game[0].status[0].resource_records : []
}
