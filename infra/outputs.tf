# Output values for use by the FastAPI server and CI/CD

output "s3_bucket_name" {
  description = "Name of the document storage bucket"
  value       = aws_s3_bucket.documents.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the document storage bucket"
  value       = aws_s3_bucket.documents.arn
}

output "sqs_queue_url" {
  description = "URL of the task processing queue"
  value       = aws_sqs_queue.tasks.url
}

output "sqs_queue_arn" {
  description = "ARN of the task processing queue"
  value       = aws_sqs_queue.tasks.arn
}

output "sqs_dlq_url" {
  description = "URL of the dead letter queue"
  value       = aws_sqs_queue.tasks_dlq.url
}

output "iam_user_arn" {
  description = "ARN of the server IAM user"
  value       = aws_iam_user.server.arn
}

output "iam_access_key_id" {
  description = "Access key ID for the server IAM user"
  value       = aws_iam_access_key.server.id
}

output "iam_secret_access_key" {
  description = "Secret access key for the server IAM user"
  value       = aws_iam_access_key.server.secret
  sensitive   = true
}

output "cloudwatch_log_group" {
  description = "Name of the API log group"
  value       = aws_cloudwatch_log_group.api.name
}
