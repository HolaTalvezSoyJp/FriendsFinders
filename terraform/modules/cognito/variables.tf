variable "project_name" {
  description = "Project name prefix for resource naming"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "cognito_domain_prefix" {
  description = "Unique subdomain prefix for Cognito hosted UI (must be globally unique, e.g. nearby-friends-128529492430)"
  type        = string
}

variable "callback_urls" {
  description = "Allowed OAuth callback URLs for the web client"
  type        = list(string)
}

variable "logout_urls" {
  description = "Allowed logout redirect URLs for the web client"
  type        = list(string)
}
