output "websocket_api_endpoint" {
  description = "WebSocket API endpoint URL"
  value       = local.websocket_api_endpoint
}

output "http_api_endpoint" {
  description = "HTTP API endpoint URL"
  value       = module.api_gateway.http_api_endpoint
}

output "users_table_name" {
  description = "Name of the Users DynamoDB table"
  value       = module.dynamodb.users_table_name
}

output "friendships_table_name" {
  description = "Name of the Friendships DynamoDB table"
  value       = module.dynamodb.friendships_table_name
}

output "connections_table_name" {
  description = "Name of the Connections DynamoDB table"
  value       = module.dynamodb.connections_table_name
}

output "friend_requests_table_name" {
  description = "Name of the FriendRequests DynamoDB table"
  value       = module.dynamodb.friend_requests_table_name
}

output "profile_pictures_bucket" {
  description = "Name of the profile pictures S3 bucket"
  value       = module.s3.bucket_name
}

# --- Frontend hosting outputs ---

output "frontend_url" {
  description = "Public URL of the deployed frontend"
  value       = "https://${module.frontend.cloudfront_domain_name}"
}

output "frontend_bucket" {
  description = "S3 bucket where the static frontend is uploaded"
  value       = module.frontend.frontend_bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (used for cache invalidations)"
  value       = module.frontend.cloudfront_distribution_id
}

output "deployer_access_key_id" {
  description = "AWS access key ID for the GitHub Actions deployer user"
  value       = module.frontend.deployer_access_key_id
}

output "deployer_secret_access_key" {
  description = "AWS secret access key for the GitHub Actions deployer user — copy to GitHub Secrets"
  value       = module.frontend.deployer_secret_access_key
  sensitive   = true
}
