variable "project_name" {
  description = "Project name prefix for resource naming"
  type        = string
}

variable "websocket_api_id" {
  description = "ID of the WebSocket API (created in root module)"
  type        = string
}

variable "websocket_api_execution_arn" {
  description = "Execution ARN of the WebSocket API"
  type        = string
}

variable "websocket_handler_invoke_arn" {
  description = "Invoke ARN of the WebSocket handler Lambda"
  type        = string
}

variable "websocket_handler_function_name" {
  description = "Function name of the WebSocket handler Lambda"
  type        = string
}

variable "rest_handler_invoke_arn" {
  description = "Invoke ARN of the REST handler Lambda"
  type        = string
}

variable "rest_handler_function_name" {
  description = "Function name of the REST handler Lambda"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
