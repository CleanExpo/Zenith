# PowerShell script to run all SQL scripts from the Zenith/scripts directory
# This script properly handles script execution from the current directory

Write-Host "Executing run_all_scripts.ps1 from the current directory..." -ForegroundColor Cyan

try {
    # Check if we're in the right directory
    if (-not (Test-Path ".\run_all_scripts.ps1")) {
        throw "Could not find run_all_scripts.ps1 in the current directory. Make sure you're running this from the Zenith/scripts directory."
    }
    
    # Execute the script
    & ".\run_all_scripts.ps1"
    
    Write-Host "Script execution completed successfully" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
