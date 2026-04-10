# Input variables for all infrastructure resources

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "eu-west-2"
}

variable "project_name" {
  description = "Project name used in resource naming"
  type        = string
  default     = "risklens"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "s3_bucket_name" {
  description = "Base name for the S3 document storage bucket"
  type        = string
  default     = "risklens-documents"
}

variable "sqs_queue_name" {
  description = "Base name for the SQS task processing queue"
  type        = string
  default     = "risklens-tasks"
}

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 30
}

variable "vps_origin" {
  description = "VPS origin URL for S3 CORS configuration"
  type        = string
  default     = "https://risklens.ai"
}

variable "tags" {
  description = "Default tags applied to all resources"
  type        = map(string)
  default = {
    project    = "risklens-ai"
    managed_by = "terraform"
  }
}
