# IAM user and least-privilege policies for the FastAPI server

locals {
  iam_user_name = "${var.project_name}-${var.environment}-server"
}

resource "aws_iam_user" "server" {
  name = local.iam_user_name

  tags = {
    Name        = local.iam_user_name
    environment = var.environment
  }
}

data "aws_iam_policy_document" "server" {
  statement {
    sid    = "S3DocumentAccess"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]
    resources = ["${aws_s3_bucket.documents.arn}/*"]
  }

  statement {
    sid    = "S3BucketList"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
    ]
    resources = [aws_s3_bucket.documents.arn]
  }

  statement {
    sid    = "SQSTaskAccess"
    effect = "Allow"
    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
    ]
    resources = [aws_sqs_queue.tasks.arn]
  }

  statement {
    sid    = "CloudWatchMetrics"
    effect = "Allow"
    actions = [
      "cloudwatch:PutMetricData",
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "cloudwatch:namespace"
      values   = ["${var.project_name}/${var.environment}"]
    }
  }

  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams",
    ]
    resources = ["${aws_cloudwatch_log_group.api.arn}:*"]
  }
}

resource "aws_iam_user_policy" "server" {
  name   = "${local.iam_user_name}-policy"
  user   = aws_iam_user.server.name
  policy = data.aws_iam_policy_document.server.json
}

resource "aws_iam_access_key" "server" {
  user = aws_iam_user.server.name
}
