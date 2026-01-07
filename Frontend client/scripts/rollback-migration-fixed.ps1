# Script PowerShell pour rollback de la migration
# Design System Mossombi - Rollback Automatique

Write-Host "ROLLBACK DE LA MIGRATION" -ForegroundColor Yellow
Write-Host "===========================" -ForegroundColor Yellow
Write-Host ""

# Verifier si on est dans le bon repertoire
if (-not (Test-Path "app")) {
    Write-Host "Erreur: Veuillez executer ce script depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Demander confirmation
Write-Host "ATTENTION: Ce script va restaurer tous les fichiers originaux (.old.tsx)" -ForegroundColor Yellow
Write-Host "ATTENTION: Les fichiers migres actuels seront supprimes" -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Continuer? (oui/non)"

if ($confirmation -ne "oui") {
    Write-Host "Rollback annule" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Debut du rollback..." -ForegroundColor Cyan
Write-Host ""

$count = 0
$errors = 0

# Trouver tous les fichiers .old.tsx
$oldFiles = Get-ChildItem -Path "app" -Filter "*.old.tsx" -Recurse

if ($oldFiles.Count -eq 0) {
    Write-Host "Aucun fichier .old.tsx trouve" -ForegroundColor Red
    Write-Host "Le rollback n'est pas possible" -ForegroundColor Red
    exit 1
}

Write-Host "Fichiers a restaurer: $($oldFiles.Count)" -ForegroundColor Cyan
Write-Host ""

foreach ($file in $oldFiles) {
    try {
        $originalPath = $file.FullName -replace "\.old\.tsx$", ".tsx"
        
        # Supprimer le fichier actuel s'il existe
        if (Test-Path $originalPath) {
            Remove-Item -Path $originalPath -Force
        }
        
        # Restaurer le fichier .old
        Move-Item -Path $file.FullName -Destination $originalPath -Force
        
        Write-Host "  OK: Restaure $($file.Name -replace '\.old\.tsx$', '.tsx')" -ForegroundColor Green
        $count++
    }
    catch {
        Write-Host "  ERREUR: $($file.Name) - $_" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""
Write-Host "===========================" -ForegroundColor Yellow
Write-Host "Rollback termine!" -ForegroundColor Green
Write-Host "Fichiers restaures: $count" -ForegroundColor Cyan
Write-Host "Erreurs: $errors" -ForegroundColor $(if ($errors -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($errors -eq 0) {
    Write-Host "SUCCES: Tous les fichiers ont ete restaures!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines etapes:" -ForegroundColor Yellow
    Write-Host "  1. Tester l'application: npm start" -ForegroundColor White
    Write-Host "  2. Verifier que tout fonctionne" -ForegroundColor White
    Write-Host "  3. Commit si necessaire: git add . && git commit -m 'chore: Rollback migration'" -ForegroundColor White
} else {
    Write-Host "ATTENTION: Certains fichiers n'ont pas pu etre restaures" -ForegroundColor Yellow
    Write-Host "Verifiez les erreurs ci-dessus" -ForegroundColor Yellow
}

Write-Host ""
