resource "aws_ssm_parameter" "search_radius_miles" {
  name  = "/nearby-friends/search-radius-miles"
  type  = "String"
  value = var.search_radius_miles

  tags = var.tags
}

resource "aws_ssm_parameter" "inactivity_ttl_seconds" {
  name  = "/nearby-friends/inactivity-ttl-seconds"
  type  = "String"
  value = var.inactivity_ttl_seconds

  tags = var.tags
}

resource "aws_ssm_parameter" "location_update_interval_seconds" {
  name  = "/nearby-friends/location-update-interval-seconds"
  type  = "String"
  value = var.location_update_interval_seconds

  tags = var.tags
}

resource "aws_ssm_parameter" "max_friends" {
  name  = "/nearby-friends/max-friends"
  type  = "String"
  value = var.max_friends

  tags = var.tags
}

resource "aws_ssm_parameter" "nearby_strangers_limit" {
  name  = "/nearby-friends/nearby-strangers-limit"
  type  = "String"
  value = var.nearby_strangers_limit

  tags = var.tags
}
