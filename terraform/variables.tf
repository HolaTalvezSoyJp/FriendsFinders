variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix for resource naming"
  type        = string
  default     = "nearby-friends"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "nearby-friends"
    Environment = "dev"
    ManagedBy   = "terraform"
    Team        = "team-3"
    Name        = "juan.contreras@iteso.mx"
  }
}
