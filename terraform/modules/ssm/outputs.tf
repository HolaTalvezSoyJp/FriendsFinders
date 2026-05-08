output "search_radius_miles_arn" {
  value = aws_ssm_parameter.search_radius_miles.arn
}

output "inactivity_ttl_seconds_arn" {
  value = aws_ssm_parameter.inactivity_ttl_seconds.arn
}

output "location_update_interval_seconds_arn" {
  value = aws_ssm_parameter.location_update_interval_seconds.arn
}

output "max_friends_arn" {
  value = aws_ssm_parameter.max_friends.arn
}

output "nearby_strangers_limit_arn" {
  value = aws_ssm_parameter.nearby_strangers_limit.arn
}

output "parameter_arns" {
  value = [
    aws_ssm_parameter.search_radius_miles.arn,
    aws_ssm_parameter.inactivity_ttl_seconds.arn,
    aws_ssm_parameter.location_update_interval_seconds.arn,
    aws_ssm_parameter.max_friends.arn,
    aws_ssm_parameter.nearby_strangers_limit.arn,
  ]
}
