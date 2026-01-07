$ErrorActionPreference = "Stop"

Write-Host "== Mossombi: Swap originals with -migrated versions ==" -ForegroundColor Cyan

$pairs = @(
    @{ Orig = "app/bookings/guide.tsx";        Migr = "app/bookings/guide-migrated.tsx" }
    @{ Orig = "app/banking/savings.tsx";        Migr = "app/banking/savings-migrated.tsx" }
    @{ Orig = "app/digital-services.tsx";       Migr = "app/digital-services-migrated.tsx" }
    @{ Orig = "app/delivery/package.tsx";       Migr = "app/delivery/package-migrated.tsx" }
    @{ Orig = "app/delivery/taxi.tsx";          Migr = "app/delivery/taxi-migrated.tsx" }
    @{ Orig = "app/delivery/gas.tsx";           Migr = "app/delivery/gas-migrated.tsx" }
    @{ Orig = "app/delivery/moving.tsx";        Migr = "app/delivery/moving-migrated.tsx" }
    @{ Orig = "app/banking.tsx";                 Migr = "app/banking-migrated.tsx" }
    @{ Orig = "app/bookings.tsx";                Migr = "app/bookings-migrated.tsx" }
    @{ Orig = "app/delivery.tsx";                Migr = "app/delivery-migrated.tsx" }
    @{ Orig = "app/public-services.tsx";         Migr = "app/public-services-migrated.tsx" }
)

foreach ($p in $pairs) {
    $orig = Join-Path -Path (Get-Location) -ChildPath $p.Orig
    $migr = Join-Path -Path (Get-Location) -ChildPath $p.Migr

    if (-not (Test-Path $migr)) {
        Write-Host "[SKIP] Missing migrated file: $($p.Migr)" -ForegroundColor Yellow
        continue
    }

    if (Test-Path $orig) {
        $backup = [System.IO.Path]::ChangeExtension($orig, ".old.tsx")
        if (-not (Test-Path $backup)) {
            Rename-Item -Path $orig -NewName (Split-Path -Path $backup -Leaf)
            Write-Host "[BACKUP] $($p.Orig) -> $(Split-Path -Path $backup -Leaf)" -ForegroundColor DarkGray
        } else {
            Write-Host "[BACKUP EXISTS] $(Split-Path -Path $backup -Leaf) already exists" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "[INFO] Original not found. Will write migrated as original: $($p.Orig)" -ForegroundColor DarkGray
    }

    $destDir = Split-Path -Path $orig -Parent
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }

    Copy-Item -Path $migr -Destination $orig -Force
    Write-Host "[REPLACED] $($p.Orig) with $($p.Migr)" -ForegroundColor Green
}

Write-Host "== Done ==" -ForegroundColor Cyan
