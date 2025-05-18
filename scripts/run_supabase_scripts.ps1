# This script runs the Supabase scripts in the correct order.
# It is assumed that the Supabase scripts are located in the Zenith\scripts\supabase directory.

# Set the path to the Supabase scripts directory
$supabaseScriptsPath = Join-Path (Get-Location) "supabase"

# Define the list of Supabase scripts to run
$supabaseScripts = @(
    "001_create_auth_schema.sql",
    "002_create_rls_policies.sql",
    "003_create_database_functions.sql",
    "004_create_storage_configuration.sql",
    # Add more scripts as needed
)

# Loop through the list of Supabase scripts and execute each one
foreach ($script in $supabaseScripts) {
    $scriptPath = Join-Path $supabaseScriptsPath $script
    if (Test-Path $scriptPath) {
        Write-Host "Executing Supabase script: $script"
# Execute the Supabase script using the appropriate command
Write-Host "Executing SQL script: $scriptPath"
Invoke-SqlCmd -ServerInstance 'localhost' -Database 'Supabase' -InputFile $scriptPath
    } else {
        Write-Warning "Supabase script not found: $script"
    }
}
