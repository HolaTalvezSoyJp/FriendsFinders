resource "aws_dynamodb_table" "users" {
  name         = "${var.project_name}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "connections" {
  name             = "${var.project_name}-connections"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "connectionId"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "connectionId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "userId-index"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "friend_requests" {
  name         = "${var.project_name}-friend-requests"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "requestId"

  attribute {
    name = "requestId"
    type = "S"
  }

  attribute {
    name = "toUserId"
    type = "S"
  }

  attribute {
    name = "fromUserId"
    type = "S"
  }

  global_secondary_index {
    name            = "toUserId-index"
    hash_key        = "toUserId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "fromUserId-index"
    hash_key        = "fromUserId"
    projection_type = "ALL"
  }

  tags = var.tags
}
