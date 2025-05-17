# Development Environment Configuration for Zenith Platform

# Project Configuration
project_name = "zenith"
environment  = "development"

# AWS Configuration
aws_region         = "us-east-1"
availability_zones = ["us-east-1a"]

# Domain Configuration
domain_name = "dev.zenith-research.com"

# Redis Configuration
redis_node_type          = "cache.t3.small"
redis_num_cache_clusters = 1

# Logging Configuration
log_retention_days = 7
log_level          = "debug"

# Monitoring Configuration
enable_monitoring = true
alarm_threshold   = 20

# Backup Configuration
enable_backups        = true
backup_retention_days = 3

# Security Configuration
enable_encryption = true
enable_waf        = false
waf_rule_limit    = 100

# CDN Configuration
enable_cdn     = false
cdn_price_class = "PriceClass_100"

# Disaster Recovery Configuration
enable_disaster_recovery = false
rpo_minutes              = 60
rto_minutes              = 240

# Multi-Region Configuration
enable_multi_region = false
secondary_region    = "us-west-2"

# Auto-Scaling Configuration
enable_auto_scaling = false
min_capacity        = 1
max_capacity        = 2
scaling_cooldown    = 300

# Alerting Configuration
enable_alerts = true
alert_email   = "dev@zenith-research.com"

# Additional Tags
tags = {
  Environment = "development"
  ManagedBy   = "terraform"
  Project     = "zenith"
  Owner       = "development-team"
  CostCenter  = "research-platform-dev"
}
