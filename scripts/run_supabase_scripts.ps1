<<<<<<< HEAD
# Define the path to the psql executable
$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

# Define the connection details
$server = "localhost"
$database = "Supabase"
$username = "phillmcgurk2025"
$password = "Sanctuary20251234567890"

# Define the directory containing the SQL scripts
$scriptDirectory = "C:\Users\Disaster Recovery 4\Desktop\Zenith\scripts\supabase\auth"

# Get all SQL scripts in the directory
$scripts = Get-ChildItem -Path $scriptDirectory -Filter *.sql | Sort-Object Name

# Loop through each script and execute it
foreach ($script in $scripts) {
    $scriptPath = $script.FullName
    Write-Output "Executing Supabase script: $($script.Name)"
    Write-Output "Executing SQL script: $scriptPath"

    # Construct the psql command arguments
    $arguments = "-h $server -d $database -U $username -f `"$scriptPath`""

    # Execute the command using Start-Process
    Start-Process -FilePath $psqlPath -ArgumentList $arguments -Wait -NoNewWindow
=======
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
>>>>>>> ef445f7eaef772d0e4a14069bfae6f16861de46d
}
