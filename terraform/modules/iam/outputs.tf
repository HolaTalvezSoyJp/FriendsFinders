output "websocket_handler_role_arn" {
  value = aws_iam_role.websocket_handler.arn
}

output "rest_handler_role_arn" {
  value = aws_iam_role.rest_handler.arn
}

output "fanout_handler_role_arn" {
  value = aws_iam_role.fanout_handler.arn
}
