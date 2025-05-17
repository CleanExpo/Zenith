#!/bin/bash
# Production Rollback Script for Zenith Research Platform
# This script rolls back the production deployment in case of issues

set -e # Exit immediately if a command exits with a non-zero status

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
  echo -e "\n${YELLOW}==== $1 ====${NC}\n"
}

# Function to print success messages
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
print_error() {
  echo -e "${RED}✗ $1${NC}"
  exit 1
}

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required tools
print_section "Checking required tools"

if ! command_exists terraform; then
  print_error "Terraform is not installed. Please install Terraform and try again."
fi

if ! command_exists vercel; then
  print_error "Vercel CLI is not installed. Please install Vercel CLI and try again."
fi

if ! command_exists npm; then
  print_error "npm is not installed. Please install Node.js and npm and try again."
fi

print_success "All required tools are installed"

# Check for required environment variables
print_section "Checking required environment variables"

required_env_vars=(
  "AWS_ACCESS_KEY_ID"
  "AWS_SECRET_ACCESS_KEY"
  "VERCEL_TOKEN"
  "SUPABASE_URL"
  "SUPABASE_SERVICE_ROLE_KEY"
  "ROLLBACK_VERSION"
)

for var in "${required_env_vars[@]}"; do
  if [ -z "${!var}" ]; then
    print_error "Environment variable $var is not set. Please set it and try again."
  fi
done

print_success "All required environment variables are set"

# Ask for confirmation
print_section "Confirmation"
echo "This script will roll back the production deployment to version ${ROLLBACK_VERSION}."
echo "This is a destructive operation and cannot be undone."
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Rollback cancelled."
  exit 0
fi

# Create rollback directory
ROLLBACK_DIR="rollback-$(date +%Y%m%d%H%M%S)"
mkdir -p "$ROLLBACK_DIR"
cd "$ROLLBACK_DIR"

# Clone repository
print_section "Cloning repository"
git clone https://github.com/your-organization/zenith.git .
print_success "Repository cloned successfully"

# Checkout rollback version
print_section "Checking out rollback version"
git checkout "$ROLLBACK_VERSION"
print_success "Rollback version checked out successfully"

# Install dependencies
print_section "Installing dependencies"
npm ci
print_success "Dependencies installed successfully"

# Rollback Vercel deployment
print_section "Rolling back Vercel deployment"
vercel rollback --token "$VERCEL_TOKEN"
print_success "Vercel deployment rolled back successfully"

# Rollback infrastructure with Terraform
print_section "Rolling back infrastructure with Terraform"

cd terraform
terraform init

echo "Planning Terraform rollback..."
terraform plan -var-file=environments/production.tfvars -out=rollback.tfplan -destroy

echo "Applying Terraform rollback..."
terraform apply rollback.tfplan

cd ..
print_success "Infrastructure rolled back successfully"

# Rollback database
print_section "Rolling back database"
echo "Restoring database from backup..."
npm run db:restore:production
print_success "Database rolled back successfully"

# Verify rollback
print_section "Verifying rollback"

# Get domain name from Terraform state
cd terraform
DOMAIN_NAME=$(terraform output -raw deployment_domain)
cd ..

# Check if the website is accessible
if curl -s --head "https://${DOMAIN_NAME}" | grep "200 OK" > /dev/null; then
  print_success "Website is accessible"
else
  print_error "Website is not accessible"
fi

# Check if the API is accessible
if curl -s --head "https://api.${DOMAIN_NAME}/api/health" | grep "200 OK" > /dev/null; then
  print_success "API is accessible"
else
  print_error "API is not accessible"
fi

# Final success message
print_section "Rollback completed successfully"
echo "The Zenith Research Platform has been rolled back to version ${ROLLBACK_VERSION}."
echo "Website URL: https://${DOMAIN_NAME}"
echo "API URL: https://api.${DOMAIN_NAME}"
echo ""
echo "Next steps:"
echo "1. Verify all features work as expected after rollback"
echo "2. Investigate the issues that caused the rollback"
echo "3. Fix the issues and prepare for a new deployment"

exit 0
