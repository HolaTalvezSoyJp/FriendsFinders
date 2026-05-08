variable "search_radius_miles" {
  description = "Search radius in miles"
  type        = string
  default     = "5"
}

variable "inactivity_ttl_seconds" {
  description = "Inactivity TTL in seconds"
  type        = string
  default     = "600"
}

variable "location_update_interval_seconds" {
  description = "Location update interval in seconds"
  type        = string
  default     = "30"
}

variable "max_friends" {
  description = "Maximum number of friends per user"
  type        = string
  default     = "5000"
}

variable "nearby_strangers_limit" {
  description = "Maximum number of nearby strangers returned"
  type        = string
  default     = "50"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
