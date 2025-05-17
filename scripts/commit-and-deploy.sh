#!/bin/bash
# Script to commit all changes to GitHub and deploy to Vercel
# This script automates the process of committing changes and deploying to Vercel

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

if ! command_exists git; then
  print_error "git is not installed. Please install git and try again."
fi

if ! command_exists vercel; then
  print_error "Vercel CLI is not installed. Please install Vercel CLI and try again."
fi

print_success "All required tools are installed"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  print_error "Not in a git repository. Please run this script from the root of your git repository."
fi

# Get commit message from arguments or prompt for one
COMMIT_MESSAGE=$1
if [ -z "$COMMIT_MESSAGE" ]; then
  echo "Enter commit message:"
  read -r COMMIT_MESSAGE
  if [ -z "$COMMIT_MESSAGE" ]; then
    COMMIT_MESSAGE="Phase 9: Production deployment preparation"
  fi
fi

# Stage all changes
print_section "Staging changes"
git add .
print_success "All changes staged"

# Commit changes
print_section "Committing changes"
git commit -m "$COMMIT_MESSAGE"
print_success "Changes committed with message: $COMMIT_MESSAGE"

# Push to GitHub
print_section "Pushing to GitHub"
git push
print_success "Changes pushed to GitHub"

# Deploy to Vercel
print_section "Deploying to Vercel"
vercel --prod
print_success "Deployed to Vercel"

# Final success message
print_section "Deployment completed successfully"
echo "The Zenith Research Platform has been committed to GitHub and deployed to Vercel."
echo "GitHub repository: https://github.com/your-organization/zenith"
echo "Vercel deployment: https://zenith-research.vercel.app"

exit 0
