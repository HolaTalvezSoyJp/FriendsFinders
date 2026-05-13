data "aws_region" "current" {}

output "user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  value = aws_cognito_user_pool.main.arn
}

output "user_pool_endpoint" {
  value = "https://${aws_cognito_user_pool.main.endpoint}"
}

output "web_client_id" {
  value = aws_cognito_user_pool_client.web.id
}

output "mobile_client_id" {
  value = aws_cognito_user_pool_client.mobile.id
}

output "hosted_ui_base_url" {
  description = "Base URL for the Cognito hosted UI"
  value       = "https://${var.cognito_domain_prefix}.auth.${data.aws_region.current.name}.amazoncognito.com"
}

output "jwks_uri" {
  description = "JWKS endpoint for JWT validation"
  value       = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}/.well-known/jwks.json"
}

output "issuer_url" {
  description = "JWT issuer URL (used by API Gateway JWT authorizer)"
  value       = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}
