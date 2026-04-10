# CloudWatch log group and metric alarms

resource "aws_cloudwatch_log_group" "api" {
  name              = "/${var.project_name}/${var.environment}/api"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "${var.project_name}-${var.environment}-api-logs"
    environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-high-error-rate"
  alarm_description   = "API error rate exceeds 5% over 5 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 5
  period              = 300
  statistic           = "Average"
  namespace           = "${var.project_name}/${var.environment}"
  metric_name         = "ErrorRate"
  treat_missing_data  = "notBreaching"

  tags = {
    environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "p95_latency" {
  alarm_name          = "${var.project_name}-${var.environment}-high-p95-latency"
  alarm_description   = "P95 latency exceeds 30 seconds"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 30000
  period              = 300
  extended_statistic  = "p95"
  namespace           = "${var.project_name}/${var.environment}"
  metric_name         = "Latency"
  treat_missing_data  = "notBreaching"

  tags = {
    environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "sqs_queue_depth" {
  alarm_name          = "${var.project_name}-${var.environment}-high-queue-depth"
  alarm_description   = "SQS queue depth exceeds 100 messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 100
  period              = 300
  statistic           = "Maximum"
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.tasks.name
  }

  tags = {
    environment = var.environment
  }
}
