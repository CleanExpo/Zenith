# Define the path to the psql executable
$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

# Define the connection details for the superuser
$superuser = "postgres"
$superuserPassword = "Sanctuary2025!"

# Set the PGPASSWORD environment variable
$env:PGPASSWORD = $superuserPassword

# Execute the command using Start-Process with the SQL query as a single argument
Start-Process -FilePath $psqlPath -ArgumentList "-h", "localhost", "-d", "postgres", "-U", $superuser, "-c", "SELECT usename FROM pg_user WHERE usename = 'phillm';" -Wait -NoNewWindow

# Clear the PGPASSWORD environment variable
$env:PGPASSWORD = $null
