# Script PowerShell pour corriger toutes les apostrophes non échappées
# Remplace ' par &apos; dans les fichiers TSX/JSX

Write-Host "🔧 Correction des apostrophes non échappées..." -ForegroundColor Cyan

$files = @(
    "app\(tabs)\orders.tsx",
    "app\+not-found.tsx",
    "app\auth\login.tsx",
    "app\banking\transfer.tsx",
    "app\banking\withdraw.tsx",
    "app\delivery\moving.tsx",
    "app\language.tsx",
    "app\modal.tsx",
    "app\notifications.tsx",
    "app\privacy.tsx",
    "app\public-services\documents.tsx",
    "app\public-services\school.tsx",
    "app\public-services\water.tsx",
    "app\security.tsx",
    "app\stats.tsx",
    "app\team.tsx",
    "components\atoms\AnimatedQuantityButton.example.tsx",
    "components\atoms\AnimationSystemExamples.tsx",
    "components\atoms\StyledCloseButton.example.tsx",
    "components\atoms\StyledCloseButton.test.tsx",
    "components\molecules\ExclusiveDigitalServiceCard.tsx",
    "components\organisms\ModalHeader.example.tsx"
)

$replacements = @{
    "l'" = "l&apos;"
    "L'" = "L&apos;"
    "d'" = "d&apos;"
    "D'" = "D&apos;"
    "n'" = "n&apos;"
    "N'" = "N&apos;"
    "s'" = "s&apos;"
    "S'" = "S&apos;"
    "c'" = "c&apos;"
    "C'" = "C&apos;"
    "m'" = "m&apos;"
    "M'" = "M&apos;"
    "t'" = "t&apos;"
    "T'" = "T&apos;"
    "j'" = "j&apos;"
    "J'" = "J&apos;"
    "qu'" = "qu&apos;"
    "Qu'" = "Qu&apos;"
}

$count = 0

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw -Encoding UTF8
        $originalContent = $content
        
        # Remplacer les apostrophes dans les balises JSX
        # Pattern: >texte avec apostrophe<
        $pattern = '(?<=>)([^<]*?)([ldnscmtjq]u?)''([^<]*?)(?=<)'
        
        $content = $content -replace "l'", "l&apos;"
        $content = $content -replace "L'", "L&apos;"
        $content = $content -replace "d'", "d&apos;"
        $content = $content -replace "D'", "D&apos;"
        $content = $content -replace "n'", "n&apos;"
        $content = $content -replace "N'", "N&apos;"
        $content = $content -replace "s'", "s&apos;"
        $content = $content -replace "S'", "S&apos;"
        $content = $content -replace "c'", "c&apos;"
        $content = $content -replace "C'", "C&apos;"
        $content = $content -replace "m'", "m&apos;"
        $content = $content -replace "M'", "M&apos;"
        $content = $content -replace "t'", "t&apos;"
        $content = $content -replace "T'", "T&apos;"
        $content = $content -replace "j'", "j&apos;"
        $content = $content -replace "J'", "J&apos;"
        $content = $content -replace "qu'", "qu&apos;"
        $content = $content -replace "Qu'", "Qu&apos;"
        
        if ($content -ne $originalContent) {
            Set-Content $fullPath -Value $content -NoNewline -Encoding UTF8
            Write-Host "  ✅ $file" -ForegroundColor Green
            $count++
        }
    } else {
        Write-Host "  ⚠️  Fichier introuvable : $file" -ForegroundColor Yellow
    }
}

Write-Host "`n✨ $count fichiers corrigés !" -ForegroundColor Green
Write-Host "🔍 Relancez 'npx eslint --fix .' pour vérifier" -ForegroundColor Cyan
