# Core Terraform configuration and AWS provider setup

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # TODO: Migrate to S3 backend for team collaboration and state locking
  # backend "s3" {
  #   bucket         = "risklens-terraform-state"
  #   key            = "infra/terraform.tfstate"
  #   region         = "eu-west-2"
  #   dynamodb_table = "risklens-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}
