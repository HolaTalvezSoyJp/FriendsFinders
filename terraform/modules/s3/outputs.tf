output "bucket_name" {
  value = aws_s3_bucket.profile_pictures.id
}

output "bucket_arn" {
  value = aws_s3_bucket.profile_pictures.arn
}
