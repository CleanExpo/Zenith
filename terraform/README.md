# Zenith Platform Infrastructure as Code

This directory contains Terraform configurations for deploying and managing the infrastructure for the Zenith Research Platform.

## Overview

The Terraform configuration in this directory defines the infrastructure required to run the Zenith platform, including:

- Networking (VPC, subnets, security groups)
- Redis for caching
- S3 for file storage
- CloudWatch for monitoring and logging
- Route53 for DNS
- Vercel for frontend deployment

## Prerequisites

Before using these Terraform configurations, ensure you have the following:

1. [Terraform](https://www.terraform.io/downloads.html) (v1.0.0 or later)
2. [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
3. [Vercel CLI](https://vercel.com/download) and an account with appropriate permissions
4. A domain name registered in Route53 or another DNS provider

## Directory Structure

```
terraform/
├── main.tf              # Main Terraform configuration
├── variables.tf         # Variable definitions
├── outputs.tf           # Output definitions
├── environments/        # Environment-specific configurations
│   ├── production.tfvars  # Production environment variables
│   ├── staging.tfvars     # Staging environment variables
│   └── development.tfvars # Development environment variables
└── README.md            # This file
```

## Usage

### Initialize Terraform

Before using Terraform, you need to initialize it:

```bash
cd terraform
terraform init
```

### Plan and Apply

To plan and apply the Terraform configuration for a specific environment:

```bash
# For production
terraform plan -var-file=environments/production.tfvars -out=production.tfplan
terraform apply production.tfplan

# For staging
terraform plan -var-file=environments/staging.tfvars -out=staging.tfplan
terraform apply staging.tfplan

# For development
terraform plan -var-file=environments/development.tfvars -out=development.tfplan
terraform apply development.tfplan
```

### Destroy

To destroy the infrastructure for a specific environment:

```bash
# For production
terraform destroy -var-file=environments/production.tfvars

# For staging
terraform destroy -var-file=environments/staging.tfvars

# For development
terraform destroy -var-file=environments/development.tfvars
```

## Environment Variables

The following environment variables are required:

- `AWS_ACCESS_KEY_ID`: AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `VERCEL_API_TOKEN`: Vercel API token

You can set these environment variables in your shell or use a `.env` file with the appropriate tool to load them.

## Terraform State

The Terraform state is stored in an S3 bucket with the following configuration:

- Bucket: `zenith-terraform-state`
- Key: `zenith/terraform.tfstate`
- Region: `us-east-1`
- Encryption: Enabled
- DynamoDB Table for Locking: `zenith-terraform-locks`

Ensure that the S3 bucket and DynamoDB table exist before initializing Terraform.

## Customizing the Configuration

### Variables

You can customize the configuration by modifying the variables in the `environments/*.tfvars` files. See `variables.tf` for a list of available variables and their descriptions.

### Adding Resources

To add new resources, modify `main.tf` and add the appropriate resource definitions. Ensure that you also update `variables.tf` and `outputs.tf` as needed.

## Outputs

After applying the Terraform configuration, you will see various outputs, including:

- VPC ID
- Subnet IDs
- Redis endpoint
- S3 bucket name
- CloudWatch log group name
- SNS topic ARN
- Vercel project ID
- Route53 zone ID and nameservers

These outputs are also saved in the Terraform state and can be retrieved using `terraform output`.

## Disaster Recovery

The Terraform configuration includes resources for disaster recovery, such as:

- Automated backups
- Multi-region deployment (optional)
- Recovery point objective (RPO) and recovery time objective (RTO) settings

Refer to the `enable_disaster_recovery`, `rpo_minutes`, and `rto_minutes` variables in the environment-specific `.tfvars` files for more information.

## Security

The Terraform configuration includes various security measures, such as:

- Encryption for sensitive data
- Security groups with restricted access
- WAF for API Gateway (optional)
- Private subnets for sensitive resources

Refer to the `enable_encryption`, `enable_waf`, and `waf_rule_limit` variables in the environment-specific `.tfvars` files for more information.

## Monitoring and Alerting

The Terraform configuration includes resources for monitoring and alerting, such as:

- CloudWatch log groups
- CloudWatch alarms
- SNS topics for alerts

Refer to the `enable_monitoring`, `alarm_threshold`, and `enable_alerts` variables in the environment-specific `.tfvars` files for more information.

## Contributing

When contributing to this Terraform configuration, please follow these guidelines:

1. Use a consistent naming convention for resources
2. Document all variables and outputs
3. Use modules for reusable components
4. Test changes in a development environment before applying to production
5. Follow the principle of least privilege for IAM roles and policies

## Troubleshooting

### Common Issues

1. **Terraform initialization fails**: Ensure that the S3 bucket and DynamoDB table for state storage exist and that you have the necessary permissions.

2. **Resource creation fails**: Check the error message and ensure that you have the necessary permissions to create the resources. Also, check that the resource names are unique and that the resource limits have not been reached.

3. **Vercel deployment fails**: Ensure that the Vercel API token is valid and that you have the necessary permissions to deploy to the specified project.

### Getting Help

If you encounter issues that are not covered in this README, please contact the infrastructure team or refer to the following resources:

- [Terraform Documentation](https://www.terraform.io/docs/index.html)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [Vercel Documentation](https://vercel.com/docs)
