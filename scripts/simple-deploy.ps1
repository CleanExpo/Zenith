# Simple deployment script for Zenith Research Platform

# Colors for output
$Green = [System.ConsoleColor]::Green
$Yellow = [System.ConsoleColor]::Yellow
$Red = [System.ConsoleColor]::Red

# Function to print section headers
function Print-Section {
    param([string]$text)
    Write-Host "`n==== $text ====" -ForegroundColor $Yellow
}

# Function to print success messages
function Print-Success {
    param([string]$text)
    Write-Host "✓ $text" -ForegroundColor $Green
}

# Function to print error messages
function Print-Error {
    param([string]$text)
    Write-Host "✗ $text" -ForegroundColor $Red
    exit 1
}

# Check if we're in the Zenith directory
if (-not (Test-Path "package.json")) {
    Print-Error "Not in the Zenith directory. Please run this script from the Zenith directory."
}

# Create or update .env.production file
Print-Section "Creating .env.production file"
$envContent = @'
NEXT_PUBLIC_SUPABASE_URL=https://uqfgdezadpkiadugufbs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZmdkZXphZHBraWFkdWd1ZmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzOTkzMTYsImV4cCI6MjA2MTk3NTMxNn0.SbBq0HA4HxD6DPMbCwU5Klx0M2FoZx-d9RE-YtQloOs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZmdkZXphZHBraWFkdWd1ZmJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjM5OTMxNiwiZXhwIjoyMDYxOTc1MzE2fQ.pkeqTet6V9Q75lNuJNQ_Rr3AuBQmovp807KSPBd-RT8
JWT_SECRET=pBtJxSFEDP028WbREM0s+UDgPlUmuuUCla2ZxTJ09xqaUka1jGYyrXgyonSatZHsGEdHogTMaBg/ERY+VuBhxQ==
'@
Set-Content -Path ".env.production" -Value $envContent
Print-Success "Created .env.production file"

# Deploy to Vercel
Print-Section "Deploying to Vercel"
vercel --prod
Print-Success "Deployed to Vercel"
