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

output "frontend_url" {
  description = "CloudFront URL for the web frontend"
  value       = module.frontend.cloudfront_url
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_web_client_id" {
  description = "Cognito web app client ID"
  value       = module.cognito.web_client_id
}

output "cognito_mobile_client_id" {
  description = "Cognito mobile client ID"
  value       = module.cognito.mobile_client_id
}

output "cognito_hosted_ui_url" {
  description = "Cognito hosted UI base URL"
  value       = module.cognito.hosted_ui_base_url
}
