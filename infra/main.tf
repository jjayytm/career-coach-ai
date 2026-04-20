terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }

  backend "s3" {
    bucket         = "job-coach-tfstate-490841876944"
    key            = "career-coach/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}
data "aws_region"          "current" {}

locals {
  name_prefix  = "${var.project_name}-${terraform.workspace}"
  s3_origin_id = "${var.project_name}-s3-${terraform.workspace}"
}
