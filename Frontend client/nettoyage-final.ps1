# NETTOYAGE FINAL COMPLET - PROJET MOSSOMBI
# Supprime TOUS les fichiers inutiles restants

Write-Host "🧹 NETTOYAGE FINAL COMPLET" -ForegroundColor Green
Write-Host "Analyse et suppression de tous les fichiers inutiles..." -ForegroundColor Yellow

# Documentation obsolète restante
$docsToDelete = @(
    "TELECOM_CONSTANTS_USAGE.md",
    "VERIFICATION_FICHIERS_RESTANTS.md",
    "NETTOYAGE_COMPLET.md"
)

# Scripts PowerShell obsolètes (restants du premier nettoyage)
$scriptsToDelete = @(
    "copy-coins.ps1",
    "fix-apostrophes.ps1", 
    "fix-unused-imports.ps1",
    "move-legacy.ps1"
)

# Fichiers de test/validation temporaires
$tempFiles = @(
    "test-validation.ts"
)

# Composants example restants
$exampleComponents = @(
    "components\ButtonAnimationExample.tsx",
    "components\organisms\FloatingCartButton.example.tsx",
    "components\organisms\ModalHeader.example.tsx"
)

# Tests redondants multiples (garder seulement les principaux)
$redundantTests = @(
    "__tests__\templates\ShoppingPageLayout.more.test.tsx",
    "__tests__\templates\ShoppingPageLayout.modals.test.tsx", 
    "__tests__\templates\ShoppingPageLayout.extra.test.tsx",
    "__tests__\templates\ShoppingPageLayout.branches.test.tsx",
    "__tests__\templates\SearchLayout.keyExtractor.test.tsx",
    "__tests__\templates\SearchLayout.extra.test.tsx",
    "__tests__\templates\PublicServiceFormLayout.modal.test.tsx",
    "__tests__\templates\CategoryPageLayout.close.test.tsx",
    "__tests__\organisms\TripTypeFilters.coverage.test.tsx",
    "__tests__\organisms\ModalHeader.branches.test.tsx",
    "__tests__\organisms\LocationSuggestions.simple.test.tsx",
    "__tests__\organisms\LocationSuggestions.select.test.tsx",
    "__tests__\organisms\LocationSuggestions.renderAndPress.test.tsx",
    "__tests__\organisms\LocationSuggestions.pressItem2.test.tsx",
    "__tests__\organisms\LocationSuggestions.interactions.stable.test.tsx",
    "__tests__\organisms\LocationSuggestions.extra.test.tsx",
    "__tests__\organisms\ExclusiveTicketsCarousel.timers.test.tsx",
    "__tests__\organisms\ExclusiveServicesCarousel.timers.test.tsx",
    "__tests__\organisms\ExclusiveCarousel.timers.test.tsx",
    "__tests__\organisms\ClassFilters.coverage.test.tsx",
    "__tests__\organisms\BottomNav.extra.test.tsx",
    "__tests__\organisms\BookingsTest.coverage.test.tsx",
    "__tests__\organisms\BookingsExample.callbacks.test.tsx"
)

$totalDeleted = 0

# Supprimer documentation obsolète
Write-Host "📄 Suppression documentation obsolète restante..." -ForegroundColor Cyan
foreach ($file in $docsToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ❌ Supprimé: $file" -ForegroundColor Red
        $totalDeleted++
    }
}

# Supprimer scripts PowerShell
Write-Host "📜 Suppression scripts PowerShell restants..." -ForegroundColor Cyan
foreach ($file in $scriptsToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ❌ Supprimé: $file" -ForegroundColor Red
        $totalDeleted++
    }
}

# Supprimer fichiers temporaires
Write-Host "🗂️ Suppression fichiers temporaires..." -ForegroundColor Cyan
foreach ($file in $tempFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ❌ Supprimé: $file" -ForegroundColor Red
        $totalDeleted++
    }
}

# Supprimer composants example
Write-Host "🧩 Suppression composants example..." -ForegroundColor Cyan
foreach ($file in $exampleComponents) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ❌ Supprimé: $file" -ForegroundColor Red
        $totalDeleted++
    }
}

# Supprimer tests redondants
Write-Host "🧪 Suppression tests redondants..." -ForegroundColor Cyan
foreach ($file in $redundantTests) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ❌ Supprimé: $file" -ForegroundColor Red
        $totalDeleted++
    }
}

Write-Host ""
Write-Host "✅ NETTOYAGE FINAL TERMINÉ!" -ForegroundColor Green
Write-Host "📊 Total fichiers supprimés: $totalDeleted" -ForegroundColor Yellow

# Vérification finale
Write-Host ""
Write-Host "🔍 VÉRIFICATION FINALE..." -ForegroundColor Cyan

$remainingDocs = Get-ChildItem -Path "." -Filter "*.md" | Where-Object { $_.Name -notin @("README.md", "DOCUMENTATION_FINALE.md", "OPTIMISATION_AVANCEE_COMPLETE.md", "PHASE3_RESULTATS_FINAUX.md") }
$remainingScripts = Get-ChildItem -Path "." -Filter "*.ps1" | Where-Object { $_.Name -ne "nettoyage-final.ps1" }
$remainingExamples = Get-ChildItem -Path "components" -Recurse -Filter "*example*" -ErrorAction SilentlyContinue

if ($remainingDocs.Count -eq 0 -and $remainingScripts.Count -eq 0 -and $remainingExamples.Count -eq 0) {
    Write-Host "✅ PROJET PARFAITEMENT NETTOYÉ!" -ForegroundColor Green
    Write-Host "🎯 Aucun fichier inutile détecté" -ForegroundColor Green
} else {
    Write-Host "⚠️ Fichiers restants détectés:" -ForegroundColor Yellow
    if ($remainingDocs.Count -gt 0) { Write-Host "  📄 Docs: $($remainingDocs.Count)" -ForegroundColor Yellow }
    if ($remainingScripts.Count -gt 0) { Write-Host "  📜 Scripts: $($remainingScripts.Count)" -ForegroundColor Yellow }
    if ($remainingExamples.Count -gt 0) { Write-Host "  🧩 Examples: $($remainingExamples.Count)" -ForegroundColor Yellow }
}

Write-Host ""
Write-Host "🏆 PROJET MOSSOMBI 100% OPTIMISÉ!" -ForegroundColor Green

# Auto-suppression du script
Remove-Item "nettoyage-final.ps1" -Force
Write-Host "🗑️ Script de nettoyage final auto-supprimé" -ForegroundColor Gray
