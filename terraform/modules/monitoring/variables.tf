variable "websocket_handler_function_name" {
  description = "Function name of the WebSocket handler Lambda"
  type        = string
}

variable "rest_handler_function_name" {
  description = "Function name of the REST handler Lambda"
  type        = string
}

variable "fanout_handler_function_name" {
  description = "Function name of the fanout handler Lambda"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
