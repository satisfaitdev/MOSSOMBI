# PowerShell wrapper pour Windows
param(
    [switch]$DryRun,
    [switch]$Verbose
)

$scriptPath = Join-Path $PSScriptRoot "migrate-layout.js"

$args = @()
if ($DryRun) { $args += "--dry-run" }
if ($Verbose) { $args += "--verbose" }

Write-Host "🚀 Lancement du script de migration LAYOUT..." -ForegroundColor Cyan
Write-Host ""

node $scriptPath $args

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Script terminé avec succès" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Le script a rencontré une erreur" -ForegroundColor Red
    exit $LASTEXITCODE
}
