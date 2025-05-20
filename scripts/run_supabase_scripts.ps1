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
}
