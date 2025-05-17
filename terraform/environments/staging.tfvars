# Staging Environment Configuration for Zenith Platform

# Project Configuration
project_name = "zenith"
environment  = "staging"

# AWS Configuration
aws_region         = "us-east-1"
availability_zones = ["us-east-1a", "us-east-1b"]

# Domain Configuration
domain_name = "staging.zenith-research.com"

# Redis Configuration
redis_node_type          = "cache.t3.medium"
redis_num_cache_clusters = 2

# Logging Configuration
log_retention_days = 30
log_level          = "debug"

# Monitoring Configuration
enable_monitoring = true
alarm_threshold   = 10

# Backup Configuration
enable_backups        = true
backup_retention_days = 7

# Security Configuration
enable_encryption = true
enable_waf        = true
waf_rule_limit    = 100

# CDN Configuration
enable_cdn     = true
cdn_price_class = "PriceClass_100"

# Disaster Recovery Configuration
enable_disaster_recovery = false
rpo_minutes              = 30
rto_minutes              = 120

# Multi-Region Configuration
enable_multi_region = false
secondary_region    = "us-west-2"

# Auto-Scaling Configuration
enable_auto_scaling = true
min_capacity        = 1
max_capacity        = 5
scaling_cooldown    = 300

# Alerting Configuration
enable_alerts = true
alert_email   = "dev@zenith-research.com"

# Additional Tags
tags = {
  Environment = "staging"
  ManagedBy   = "terraform"
  Project     = "zenith"
  Owner       = "development-team"
  CostCenter  = "research-platform-dev"
}
