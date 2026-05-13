output "user_pool_arn" {
  value = aws_cognito_user_pool.main.arn
}

output "user_pool_endpoint" {
  value = "https://${aws_cognito_user_pool.main.endpoint}"
}

output "user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.mobile.id
}
