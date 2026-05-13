output "frontend_bucket_name" {
  description = "Name of the S3 bucket hosting the frontend assets"
  value       = aws_s3_bucket.frontend.bucket
}

output "cloudfront_domain_name" {
  description = "CloudFront default domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for invalidations"
  value       = aws_cloudfront_distribution.frontend.id
}

output "deployer_access_key_id" {
  description = "Access key ID for the GitHub Actions deployer user"
  value       = aws_iam_access_key.deployer.id
}

output "deployer_secret_access_key" {
  description = "Secret access key for the GitHub Actions deployer user"
  value       = aws_iam_access_key.deployer.secret
  sensitive   = true
}
