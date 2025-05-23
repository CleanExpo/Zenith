# 🚀 Zenith SaaS Deployment Script (PowerShell)
# This script automates the deployment process for Windows

param(
    [string]$Platform = ""
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Zenith SaaS Deployment Process..." -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-ErrorMessage {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-ErrorMessage "package.json not found. Please run this script from the project root."
    exit 1
}

# Check if git is clean
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Warning "Working directory is not clean. Committing changes..."
    git add .
    git commit -m "chore: prepare for deployment"
}

Write-Status "Running pre-deployment checks..."

try {
    # 1. Install dependencies
    Write-Status "Installing dependencies..."
    npm ci

    # 2. Run linting
    Write-Status "Running ESLint..."
    try {
        npm run lint
    }
    catch {
        Write-Warning "Linting issues found. Attempting to fix..."
        try {
            npm run lint:fix
        }
        catch {
            Write-Warning "Some linting issues could not be auto-fixed"
        }
    }

    # 3. Run type checking
    Write-Status "Running TypeScript type checking..."
    npx tsc --noEmit

    # 4. Run tests
    Write-Status "Running tests..."
    npm test -- --passWithNoTests

    # 5. Build the application
    Write-Status "Building the application..."
    npm run build

    Write-Success "Build completed successfully!"

    # 6. Security audit
    Write-Status "Running security audit..."
    try {
        npm audit --audit-level=high
    }
    catch {
        Write-Warning "Security vulnerabilities found. Consider fixing them."
    }

    # 7. Check for environment variables
    Write-Status "Checking environment configuration..."
    if (-not (Test-Path ".env.local") -and -not (Test-Path ".env.production")) {
        Write-Warning "No environment files found. Make sure to configure environment variables in your deployment platform."
    }

    # 8. Push to repository
    Write-Status "Pushing to repository..."
    git push origin main

    Write-Success "Code pushed to repository successfully!"

    # 9. Deploy based on platform
    if (-not $Platform) {
        Write-Host ""
        Write-Host "🌐 Choose your deployment platform:" -ForegroundColor Blue
        Write-Host "1) Vercel (Recommended)"
        Write-Host "2) Netlify"
        Write-Host "3) Railway"
        Write-Host "4) Manual deployment"
        Write-Host ""
        $choice = Read-Host "Enter your choice (1-4)"
    }
    else {
        $choice = $Platform
    }

    switch ($choice) {
        "1" {
            Write-Status "Deploying to Vercel..."
            if (Get-Command vercel -ErrorAction SilentlyContinue) {
                vercel --prod
                Write-Success "Deployed to Vercel successfully!"
            }
            else {
                Write-Warning "Vercel CLI not found. Installing..."
                npm install -g vercel
                vercel login
                vercel --prod
            }
        }
        "2" {
            Write-Status "For Netlify deployment:"
            Write-Host "1. Go to https://app.netlify.com/"
            Write-Host "2. Connect your GitHub repository"
            Write-Host "3. Set build command: npm run build"
            Write-Host "4. Set publish directory: .next"
            Write-Host "5. Add environment variables from DEPLOYMENT_GUIDE.md"
        }
        "3" {
            Write-Status "Deploying to Railway..."
            if (Get-Command railway -ErrorAction SilentlyContinue) {
                railway up
                Write-Success "Deployed to Railway successfully!"
            }
            else {
                Write-Warning "Railway CLI not found. Installing..."
                npm install -g @railway/cli
                railway login
                railway link
                railway up
            }
        }
        "4" {
            Write-Status "Manual deployment selected."
            Write-Host "Please follow the instructions in DEPLOYMENT_GUIDE.md"
        }
        default {
            Write-ErrorMessage "Invalid choice. Please run the script again."
            exit 1
        }
    }

    Write-Host ""
    Write-Success "🎉 Deployment process completed!"
    Write-Host ""
    Write-Host "📋 Post-deployment checklist:" -ForegroundColor Blue
    Write-Host "□ Verify application loads correctly"
    Write-Host "□ Test authentication flow"
    Write-Host "□ Check database connections"
    Write-Host "□ Test payment processing (if configured)"
    Write-Host "□ Verify all pages render properly"
    Write-Host "□ Test API endpoints"
    Write-Host "□ Monitor application performance"
    Write-Host ""
    Write-Host "📖 For detailed configuration, see DEPLOYMENT_GUIDE.md" -ForegroundColor Yellow
    Write-Host "🔧 For troubleshooting, check the deployment platform logs" -ForegroundColor Yellow
}
catch {
    $errorMsg = $_.Exception.Message
    Write-ErrorMessage "Deployment failed: $errorMsg"
    exit 1
}
