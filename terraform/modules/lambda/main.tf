resource "aws_lambda_function" "websocket_handler" {
  function_name = "${var.project_name}-websocket-handler"
  role          = var.websocket_handler_role_arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 256

  filename         = "../dist/websocket-handler.zip"
  source_code_hash = filebase64sha256("../dist/websocket-handler.zip")

  environment {
    variables = {
      USERS_TABLE_NAME           = var.users_table_name
      FRIENDSHIPS_TABLE_NAME     = var.friendships_table_name
      CONNECTIONS_TABLE_NAME     = var.connections_table_name
      S3_BUCKET_NAME             = var.s3_bucket_name
      WEBSOCKET_API_ENDPOINT     = var.websocket_api_endpoint
      SSM_SEARCH_RADIUS          = "/nearby-friends/search-radius-miles"
      SSM_INACTIVITY_TTL         = "/nearby-friends/inactivity-ttl-seconds"
      SSM_LOCATION_UPDATE_INTERVAL = "/nearby-friends/location-update-interval-seconds"
      SSM_MAX_FRIENDS            = "/nearby-friends/max-friends"
    }
  }

  tags = var.tags
}

resource "aws_lambda_function" "rest_handler" {
  function_name = "${var.project_name}-rest-handler"
  role          = var.rest_handler_role_arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 256

  filename         = "../dist/rest-handler.zip"
  source_code_hash = filebase64sha256("../dist/rest-handler.zip")

  environment {
    variables = {
      USERS_TABLE_NAME           = var.users_table_name
      FRIENDSHIPS_TABLE_NAME     = var.friendships_table_name
      CONNECTIONS_TABLE_NAME     = var.connections_table_name
      FRIEND_REQUESTS_TABLE_NAME = var.friend_requests_table_name
      S3_BUCKET_NAME             = var.s3_bucket_name
      WEBSOCKET_API_ENDPOINT     = var.websocket_api_endpoint
      SSM_SEARCH_RADIUS          = "/nearby-friends/search-radius-miles"
      SSM_INACTIVITY_TTL         = "/nearby-friends/inactivity-ttl-seconds"
      SSM_MAX_FRIENDS            = "/nearby-friends/max-friends"
      SSM_NEARBY_STRANGERS_LIMIT = "/nearby-friends/nearby-strangers-limit"
    }
  }

  tags = var.tags
}

resource "aws_lambda_function" "fanout_handler" {
  function_name = "${var.project_name}-fanout-handler"
  role          = var.fanout_handler_role_arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 256

  filename         = "../dist/fanout-handler.zip"
  source_code_hash = filebase64sha256("../dist/fanout-handler.zip")

  environment {
    variables = {
      USERS_TABLE_NAME       = var.users_table_name
      FRIENDSHIPS_TABLE_NAME = var.friendships_table_name
      CONNECTIONS_TABLE_NAME = var.connections_table_name
      S3_BUCKET_NAME         = var.s3_bucket_name
      WEBSOCKET_API_ENDPOINT = var.websocket_api_endpoint
      SSM_SEARCH_RADIUS      = "/nearby-friends/search-radius-miles"
      SSM_INACTIVITY_TTL     = "/nearby-friends/inactivity-ttl-seconds"
    }
  }

  tags = var.tags
}

# DynamoDB Stream trigger for fanout handler
resource "aws_lambda_event_source_mapping" "connections_stream" {
  event_source_arn  = var.connections_table_stream_arn
  function_name     = aws_lambda_function.fanout_handler.arn
  starting_position = "LATEST"
  batch_size        = 10

  filter_criteria {
    filter {
      pattern = jsonencode({ eventName = ["INSERT", "REMOVE"] })
    }
  }
}
