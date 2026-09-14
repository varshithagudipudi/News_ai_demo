$ErrorActionPreference = 'Stop'

$projectDirectory = Split-Path -Parent $PSScriptRoot
$backupDirectory = Join-Path $projectDirectory '.data'
$postgresBin = 'C:\Program Files\PostgreSQL\18\bin'
$dumpCommand = Join-Path $postgresBin 'pg_dump.exe'
$restoreCommand = Join-Path $postgresBin 'pg_restore.exe'

if (!(Test-Path -LiteralPath $dumpCommand) -or !(Test-Path -LiteralPath $restoreCommand)) {
    throw 'PostgreSQL 18 command line tools were not found.'
}

New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
$backupName = 'before-dedup-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N').Substring(0, 8) + '.backup'
$backupPath = Join-Path $backupDirectory $backupName
$partialPath = $backupPath + '.partial'

Write-Host 'Enter your Supabase database password when prompted. Input will be invisible.'
& $dumpCommand '--host=aws-0-ap-northeast-1.pooler.supabase.com' '--port=5432' '--username=postgres.oixxdxnwhadiltycsxny' '--dbname=postgres' '--password' '--format=custom' "--file=$partialPath"
if ($LASTEXITCODE -ne 0) {
    throw 'Backup failed. Any .partial file is incomplete; do not use it as a backup.'
}

& $restoreCommand '--list' $partialPath | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw 'Archive verification failed. Do not delete database records.'
}

Move-Item -LiteralPath $partialPath -Destination $backupPath
Write-Host "Backup created: $backupPath"
Write-Host 'Archive contents are readable. A full restore has not been tested. No database records were changed.'
