# Terraform Outputs for Zenith Platform

# VPC Outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "The IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "The IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

# Redis Outputs
output "redis_primary_endpoint" {
  description = "The primary endpoint of the Redis cluster"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "redis_reader_endpoint" {
  description = "The reader endpoint of the Redis cluster"
  value       = aws_elasticache_replication_group.redis.reader_endpoint_address
}

output "redis_port" {
  description = "The port of the Redis cluster"
  value       = aws_elasticache_replication_group.redis.port
}

# S3 Outputs
output "s3_bucket_name" {
  description = "The name of the S3 bucket for file storage"
  value       = aws_s3_bucket.storage.bucket
}

output "s3_bucket_arn" {
  description = "The ARN of the S3 bucket for file storage"
  value       = aws_s3_bucket.storage.arn
}

output "s3_bucket_domain_name" {
  description = "The domain name of the S3 bucket for file storage"
  value       = aws_s3_bucket.storage.bucket_domain_name
}

# CloudWatch Outputs
output "cloudwatch_log_group_name" {
  description = "The name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "cloudwatch_log_group_arn" {
  description = "The ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.arn
}

# SNS Outputs
output "sns_topic_arn" {
  description = "The ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

# Vercel Outputs
output "vercel_project_id" {
  description = "The ID of the Vercel project"
  value       = vercel_project.app.id
}

output "vercel_project_name" {
  description = "The name of the Vercel project"
  value       = vercel_project.app.name
}

output "vercel_project_url" {
  description = "The URL of the Vercel project"
  value       = "https://${var.domain_name}"
}

# Route53 Outputs
output "route53_zone_id" {
  description = "The ID of the Route53 zone"
  value       = aws_route53_zone.main.zone_id
}

output "route53_zone_name" {
  description = "The name of the Route53 zone"
  value       = aws_route53_zone.main.name
}

output "route53_nameservers" {
  description = "The nameservers of the Route53 zone"
  value       = aws_route53_zone.main.name_servers
}

# Deployment Information
output "deployment_environment" {
  description = "The deployment environment"
  value       = var.environment
}

output "deployment_region" {
  description = "The deployment region"
  value       = var.aws_region
}

output "deployment_domain" {
  description = "The deployment domain"
  value       = var.domain_name
}

# Security Information
output "security_groups" {
  description = "The security groups created"
  value = {
    redis = aws_security_group.redis.id
  }
}

# Monitoring Information
output "monitoring_alarms" {
  description = "The CloudWatch alarms created"
  value = {
    api_errors = aws_cloudwatch_metric_alarm.api_errors.arn
  }
}

# Deployment Instructions
output "deployment_instructions" {
  description = "Instructions for completing the deployment"
  value       = <<-EOT
    Deployment Complete!
    
    To complete the setup:
    
    1. Configure your domain registrar to use the following nameservers:
       ${join("\n       ", aws_route53_zone.main.name_servers)}
    
    2. Verify the Vercel deployment at: https://${var.domain_name}
    
    3. Configure your application to use the following Redis endpoint:
       ${aws_elasticache_replication_group.redis.primary_endpoint_address}:${aws_elasticache_replication_group.redis.port}
    
    4. Configure your application to use the following S3 bucket for file storage:
       ${aws_s3_bucket.storage.bucket}
    
    5. Subscribe to the SNS topic for alerts:
       ${aws_sns_topic.alerts.arn}
    
    6. Check the CloudWatch logs at:
       ${aws_cloudwatch_log_group.app_logs.name}
  EOT
}

# Terraform State Information
output "terraform_version" {
  description = "The version of Terraform used for this deployment"
  value       = terraform.required_version
}

output "terraform_providers" {
  description = "The providers used for this deployment"
  value = {
    aws    = "hashicorp/aws"
    vercel = "vercel/vercel"
  }
}

output "terraform_backend" {
  description = "The backend used for this deployment"
  value = {
    type    = "s3"
    bucket  = "zenith-terraform-state"
    key     = "zenith/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}
