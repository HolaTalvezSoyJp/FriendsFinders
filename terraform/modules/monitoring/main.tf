resource "aws_cloudwatch_log_group" "websocket_handler" {
  name              = "/aws/lambda/${var.websocket_handler_function_name}"
  retention_in_days = 14

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "rest_handler" {
  name              = "/aws/lambda/${var.rest_handler_function_name}"
  retention_in_days = 14

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "fanout_handler" {
  name              = "/aws/lambda/${var.fanout_handler_function_name}"
  retention_in_days = 14

  tags = var.tags
}

# Error alarms per Lambda
resource "aws_cloudwatch_metric_alarm" "websocket_handler_errors" {
  alarm_name          = "${var.websocket_handler_function_name}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "WebSocket handler error rate exceeded threshold"

  dimensions = {
    FunctionName = var.websocket_handler_function_name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "rest_handler_errors" {
  alarm_name          = "${var.rest_handler_function_name}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "REST handler error rate exceeded threshold"

  dimensions = {
    FunctionName = var.rest_handler_function_name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "fanout_handler_errors" {
  alarm_name          = "${var.fanout_handler_function_name}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Fanout handler error rate exceeded threshold"

  dimensions = {
    FunctionName = var.fanout_handler_function_name
  }

  tags = var.tags
}
