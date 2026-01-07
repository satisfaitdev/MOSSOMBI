# Script PowerShell pour rollback de la migration
# Design System Mossombi - Rollback Automatique

Write-Host "🔙 ROLLBACK DE LA MIGRATION" -ForegroundColor Yellow
Write-Host "===========================" -ForegroundColor Yellow
Write-Host ""

# Vérifier si on est dans le bon répertoire
if (-not (Test-Path "app")) {
    Write-Host "❌ Erreur: Veuillez exécuter ce script depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Demander confirmation
Write-Host "⚠️  Ce script va restaurer tous les fichiers originaux (.old.tsx)" -ForegroundColor Yellow
Write-Host "⚠️  Les fichiers migrés actuels seront supprimés" -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Continuer? (oui/non)"

if ($confirmation -ne "oui") {
    Write-Host "❌ Rollback annulé" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "📦 Début du rollback..." -ForegroundColor Cyan
Write-Host ""

$count = 0
$errors = 0

# Trouver tous les fichiers .old.tsx
$oldFiles = Get-ChildItem -Path "app" -Filter "*.old.tsx" -Recurse

if ($oldFiles.Count -eq 0) {
    Write-Host "❌ Aucun fichier .old.tsx trouvé" -ForegroundColor Red
    Write-Host "Le rollback n'est pas possible" -ForegroundColor Red
    exit 1
}

Write-Host "📊 $($oldFiles.Count) fichiers à restaurer" -ForegroundColor Cyan
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
        
        Write-Host "  ✅ Restauré: $($file.Name -replace '\.old\.tsx$', '.tsx')" -ForegroundColor Green
        $count++
    }
    catch {
        Write-Host "  ❌ Erreur: $($file.Name) - $_" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""
Write-Host "===========================" -ForegroundColor Yellow
Write-Host "✅ Rollback terminé!" -ForegroundColor Green
Write-Host "📊 Fichiers restaurés: $count" -ForegroundColor Cyan
Write-Host "❌ Erreurs: $errors" -ForegroundColor $(if ($errors -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($errors -eq 0) {
    Write-Host "🎉 Tous les fichiers ont été restaurés avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "  1. Tester l'application: npm start" -ForegroundColor White
    Write-Host "  2. Vérifier que tout fonctionne" -ForegroundColor White
    Write-Host "  3. Commit si nécessaire: git add . && git commit -m 'chore: Rollback migration'" -ForegroundColor White
} else {
    Write-Host "⚠️  Certains fichiers n'ont pas pu être restaurés" -ForegroundColor Yellow
    Write-Host "Vérifiez les erreurs ci-dessus" -ForegroundColor Yellow
}

Write-Host ""
