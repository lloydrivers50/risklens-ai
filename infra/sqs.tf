# SQS queues for async task processing

locals {
  queue_name     = "${var.project_name}-${var.environment}-tasks"
  dlq_queue_name = "${var.project_name}-${var.environment}-tasks-dlq"
}

resource "aws_sqs_queue" "tasks_dlq" {
  name                      = local.dlq_queue_name
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name        = local.dlq_queue_name
    environment = var.environment
  }
}

resource "aws_sqs_queue" "tasks" {
  name                       = local.queue_name
  visibility_timeout_seconds = 300
  message_retention_seconds  = 604800 # 7 days
  receive_wait_time_seconds  = 20     # long polling

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.tasks_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name        = local.queue_name
    environment = var.environment
  }
}
