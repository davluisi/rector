$folder = Resolve-Path "backend/src"
$fsw = New-Object IO.FileSystemWatcher $folder -Property @{
    IncludeSubdirectories = $true
    EnableRaisingEvents = $true
}

$action = {
    param($sender, $eventArgs)
    $changeType = $eventArgs.ChangeType
    $filePath = $eventArgs.FullPath
    Write-Host "[Watcher] File changed: $filePath ($changeType). Recompiling..." -ForegroundColor Cyan
    # Run maven compile inside backend directory
    Push-Location backend
    mvn compile
    Pop-Location
    Write-Host "[Watcher] Compilation complete." -ForegroundColor Green
}

$handlers = @()
$handlers += Register-ObjectEvent $fsw Changed -Action $action
$handlers += Register-ObjectEvent $fsw Created -Action $action
$handlers += Register-ObjectEvent $fsw Deleted -Action $action

Write-Host "Watching for backend source changes in $folder..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop watching." -ForegroundColor Gray

try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "Stopping watcher..."
    $handlers | ForEach-Object { Unregister-Event -SourceIdentifier $_.Name }
}
