#!/bin/bash

# 🚀 Zenith SaaS Deployment Script
# This script automates the deployment process

set -e  # Exit on any error

echo "🚀 Starting Zenith SaaS Deployment Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Working directory is not clean. Committing changes..."
    git add .
    git commit -m "chore: prepare for deployment"
fi

print_status "Running pre-deployment checks..."

# 1. Install dependencies
print_status "Installing dependencies..."
npm ci

# 2. Run linting
print_status "Running ESLint..."
npm run lint || {
    print_warning "Linting issues found. Attempting to fix..."
    npm run lint:fix || print_warning "Some linting issues could not be auto-fixed"
}

# 3. Run type checking
print_status "Running TypeScript type checking..."
npx tsc --noEmit || {
    print_error "TypeScript errors found. Please fix them before deploying."
    exit 1
}

# 4. Run tests
print_status "Running tests..."
npm test -- --passWithNoTests || {
    print_error "Tests failed. Please fix them before deploying."
    exit 1
}

# 5. Build the application
print_status "Building the application..."
npm run build || {
    print_error "Build failed. Please fix build errors before deploying."
    exit 1
}

print_success "Build completed successfully!"

# 6. Security audit
print_status "Running security audit..."
npm audit --audit-level=high || {
    print_warning "Security vulnerabilities found. Consider fixing them."
}

# 7. Check for environment variables
print_status "Checking environment configuration..."
if [ ! -f ".env.local" ] && [ ! -f ".env.production" ]; then
    print_warning "No environment files found. Make sure to configure environment variables in your deployment platform."
fi

# 8. Push to repository
print_status "Pushing to repository..."
git push origin main || {
    print_error "Failed to push to repository."
    exit 1
}

print_success "Code pushed to repository successfully!"

# 9. Deploy based on platform
echo ""
echo "🌐 Choose your deployment platform:"
echo "1) Vercel (Recommended)"
echo "2) Netlify"
echo "3) Railway"
echo "4) Manual deployment"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        print_status "Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
            print_success "Deployed to Vercel successfully!"
        else
            print_warning "Vercel CLI not found. Installing..."
            npm install -g vercel
            vercel login
            vercel --prod
        fi
        ;;
    2)
        print_status "For Netlify deployment:"
        echo "1. Go to https://app.netlify.com/"
        echo "2. Connect your GitHub repository"
        echo "3. Set build command: npm run build"
        echo "4. Set publish directory: .next"
        echo "5. Add environment variables from DEPLOYMENT_GUIDE.md"
        ;;
    3)
        print_status "Deploying to Railway..."
        if command -v railway &> /dev/null; then
            railway up
            print_success "Deployed to Railway successfully!"
        else
            print_warning "Railway CLI not found. Installing..."
            npm install -g @railway/cli
            railway login
            railway link
            railway up
        fi
        ;;
    4)
        print_status "Manual deployment selected."
        echo "Please follow the instructions in DEPLOYMENT_GUIDE.md"
        ;;
    *)
        print_error "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
print_success "🎉 Deployment process completed!"
echo ""
echo "📋 Post-deployment checklist:"
echo "□ Verify application loads correctly"
echo "□ Test authentication flow"
echo "□ Check database connections"
echo "□ Test payment processing (if configured)"
echo "□ Verify all pages render properly"
echo "□ Test API endpoints"
echo "□ Monitor application performance"
echo ""
echo "📖 For detailed configuration, see DEPLOYMENT_GUIDE.md"
echo "🔧 For troubleshooting, check the deployment platform logs"
