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
