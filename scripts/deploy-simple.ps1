# 🚀 Zenith SaaS Simple Deployment Script (PowerShell)
# This script provides a simplified deployment process for Windows

param(
    [string]$Platform = ""
)

Write-Host "🚀 Starting Zenith SaaS Deployment Process..." -ForegroundColor Blue

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Running pre-deployment checks..." -ForegroundColor Cyan

# 1. Install dependencies
Write-Host "[INFO] Installing dependencies..." -ForegroundColor Cyan
npm ci

# 2. Build the application
Write-Host "[INFO] Building the application..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Build completed successfully!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Build failed. Please fix build errors before deploying." -ForegroundColor Red
    exit 1
}

# 3. Push to repository
Write-Host "[INFO] Pushing to repository..." -ForegroundColor Cyan
git add .
git commit -m "chore: prepare for deployment" 2>$null
git push origin main

Write-Host "[SUCCESS] Code pushed to repository successfully!" -ForegroundColor Green

# 4. Deploy based on platform
if (-not $Platform) {
    Write-Host ""
    Write-Host "🌐 Choose your deployment platform:" -ForegroundColor Blue
    Write-Host "1) Vercel (Recommended)"
    Write-Host "2) Netlify"
    Write-Host "3) Railway"
    Write-Host "4) Manual deployment"
    Write-Host ""
    $choice = Read-Host "Enter your choice (1-4)"
} else {
    $choice = $Platform
}

switch ($choice) {
    "1" {
        Write-Host "[INFO] Deploying to Vercel..." -ForegroundColor Cyan
        if (Get-Command vercel -ErrorAction SilentlyContinue) {
            vercel --prod
            Write-Host "[SUCCESS] Deployed to Vercel successfully!" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Vercel CLI not found. Installing..." -ForegroundColor Yellow
            npm install -g vercel
            vercel login
            vercel --prod
        }
    }
    "2" {
        Write-Host "[INFO] For Netlify deployment:" -ForegroundColor Cyan
        Write-Host "1. Go to https://app.netlify.com/"
        Write-Host "2. Connect your GitHub repository"
        Write-Host "3. Set build command: npm run build"
        Write-Host "4. Set publish directory: .next"
        Write-Host "5. Add environment variables from DEPLOYMENT_GUIDE.md"
    }
    "3" {
        Write-Host "[INFO] Deploying to Railway..." -ForegroundColor Cyan
        if (Get-Command railway -ErrorAction SilentlyContinue) {
            railway up
            Write-Host "[SUCCESS] Deployed to Railway successfully!" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Railway CLI not found. Installing..." -ForegroundColor Yellow
            npm install -g @railway/cli
            railway login
            railway link
            railway up
        }
    }
    "4" {
        Write-Host "[INFO] Manual deployment selected." -ForegroundColor Cyan
        Write-Host "Please follow the instructions in DEPLOYMENT_GUIDE.md"
    }
    default {
        Write-Host "[ERROR] Invalid choice. Please run the script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "[SUCCESS] 🎉 Deployment process completed!" -ForegroundColor Green
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
