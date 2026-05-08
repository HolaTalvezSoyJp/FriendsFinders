output "websocket_handler_arn" {
  value = aws_lambda_function.websocket_handler.arn
}

output "websocket_handler_invoke_arn" {
  value = aws_lambda_function.websocket_handler.invoke_arn
}

output "websocket_handler_function_name" {
  value = aws_lambda_function.websocket_handler.function_name
}

output "rest_handler_arn" {
  value = aws_lambda_function.rest_handler.arn
}

output "rest_handler_invoke_arn" {
  value = aws_lambda_function.rest_handler.invoke_arn
}

output "rest_handler_function_name" {
  value = aws_lambda_function.rest_handler.function_name
}

output "fanout_handler_arn" {
  value = aws_lambda_function.fanout_handler.arn
}

output "fanout_handler_function_name" {
  value = aws_lambda_function.fanout_handler.function_name
}
