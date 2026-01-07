# Move legacy files to archive folder

if (-not (Test-Path "legacy")) {
    New-Item -ItemType Directory -Path "legacy" | Out-Null
}

$oldFiles = Get-ChildItem -Path "app" -Recurse -Filter "*.old.tsx"
$movedCount = 0

foreach ($file in $oldFiles) {
    $destPath = Join-Path "legacy" $file.Name
    if (Test-Path $destPath) {
        Remove-Item $destPath -Force
    }
    Move-Item -Path $file.FullName -Destination "legacy" -Force
    $movedCount++
}

Write-Host "Moved $movedCount .old.tsx files to legacy/"

$backFiles = Get-ChildItem -Path "app" -Recurse -Filter "*_back.tsx"
$backCount = 0

foreach ($file in $backFiles) {
    $destPath = Join-Path "legacy" $file.Name
    if (Test-Path $destPath) {
        Remove-Item $destPath -Force
    }
    Move-Item -Path $file.FullName -Destination "legacy" -Force
    $backCount++
}

Write-Host "Moved $backCount _back.tsx files to legacy/"
Write-Host "Total archived: $($movedCount + $backCount) files"
