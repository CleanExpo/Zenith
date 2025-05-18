#!/bin/bash
# Simple deployment script for Zenith Research Platform

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

# Check if we're in the Zenith directory
if [ ! -f "package.json" ]; then
  print_error "Not in the Zenith directory. Please run this script from the Zenith directory."
fi

# Create or update .env.production file
print_section "Creating .env.production file"
cat > .env.production << EOF
NEXT_PUBLIC_SUPABASE_URL=https://uqfgdezadpkiadugufbs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZmdkZXphZHBraWFkdWd1ZmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzOTkzMTYsImV4cCI6MjA2MTk3NTMxNn0.SbBq0HA4HxD6DPMbCwU5Klx0M2FoZx-d9RE-YtQloOs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZmdkZXphZHBraWFkdWd1ZmJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjM5OTMxNiwiZXhwIjoyMDYxOTc1MzE2fQ.pkeqTet6V9Q75lNuJNQ_Rr3AuBQmovp807KSPBd-RT8
JWT_SECRET=pBtJxSFEDP028WbREM0s+UDgPlUmuuUCla2ZxTJ09xqaUka1jGYyrXgyonSatZHsGEdHogTMaBg/ERY+VuBhxQ==
EOF
print_success "Created .env.production file"

# Deploy to Vercel
print_section "Deploying to Vercel"
vercel --prod
print_success "Deployed to Vercel"

exit 0
