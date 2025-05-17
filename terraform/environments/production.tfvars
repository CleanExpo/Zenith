# Production Environment Configuration for Zenith Platform

# Project Configuration
project_name = "zenith"
environment  = "production"

# AWS Configuration
aws_region         = "us-east-1"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Domain Configuration
domain_name = "zenith-research.com"

# Redis Configuration
redis_node_type          = "cache.m5.large"
redis_num_cache_clusters = 2

# Logging Configuration
log_retention_days = 90
log_level          = "info"

# Monitoring Configuration
enable_monitoring = true
alarm_threshold   = 5

# Backup Configuration
enable_backups        = true
backup_retention_days = 30

# Security Configuration
enable_encryption = true
enable_waf        = true
waf_rule_limit    = 100

# CDN Configuration
enable_cdn     = true
cdn_price_class = "PriceClass_All"

# Disaster Recovery Configuration
enable_disaster_recovery = true
rpo_minutes              = 15
rto_minutes              = 60

# Multi-Region Configuration
enable_multi_region = true
secondary_region    = "us-west-2"

# Auto-Scaling Configuration
enable_auto_scaling = true
min_capacity        = 2
max_capacity        = 20
scaling_cooldown    = 300

# Alerting Configuration
enable_alerts = true
alert_email   = "admin@zenith-research.com"

# Additional Tags
tags = {
  Environment = "production"
  ManagedBy   = "terraform"
  Project     = "zenith"
  Owner       = "operations-team"
  CostCenter  = "research-platform"
}
