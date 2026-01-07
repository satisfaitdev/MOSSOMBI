# Script PowerShell pour deployer les pages migrees
# Design System Mossombi - Deploiement Automatique

Write-Host "DEPLOIEMENT DES PAGES MIGREES" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Verifier si on est dans le bon repertoire
if (-not (Test-Path "app")) {
    Write-Host "Erreur: Veuillez executer ce script depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Demander confirmation
Write-Host "ATTENTION: Ce script va remplacer 69 fichiers originaux par leurs versions migrees." -ForegroundColor Yellow
Write-Host "ATTENTION: Les fichiers originaux seront renommes en .old.tsx" -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Continuer? (oui/non)"

if ($confirmation -ne "oui") {
    Write-Host "Deploiement annule" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Debut du deploiement..." -ForegroundColor Cyan
Write-Host ""

$count = 0
$errors = 0

# Fonction pour deployer un fichier
function Deploy-File {
    param (
        [string]$path,
        [string]$category
    )
    
    $original = "$path.tsx"
    $migrated = "$path-migrated.tsx"
    $backup = "$path.old.tsx"
    
    if (Test-Path $migrated) {
        try {
            # Backup de l'original s'il existe
            if (Test-Path $original) {
                Move-Item -Path $original -Destination $backup -Force
            }
            
            # Deployer la version migree
            Move-Item -Path $migrated -Destination $original -Force
            
            Write-Host "  OK: $original" -ForegroundColor Green
            $script:count++
        }
        catch {
            Write-Host "  ERREUR: $original - $_" -ForegroundColor Red
            $script:errors++
        }
    }
}

# Auth (7 fichiers)
Write-Host "[Auth] 7 fichiers..." -ForegroundColor Cyan
Deploy-File "app/auth/login" "Auth"
Deploy-File "app/auth/register-step1" "Auth"
Deploy-File "app/auth/register-step2" "Auth"
Deploy-File "app/auth/register-step3" "Auth"
Deploy-File "app/auth/forgot-password-step1" "Auth"
Deploy-File "app/auth/forgot-password-step2" "Auth"
Deploy-File "app/auth/forgot-password-step3" "Auth"

# Tabs (5 fichiers)
Write-Host "[Tabs] 5 fichiers..." -ForegroundColor Cyan
Deploy-File "app/(tabs)/index" "Tabs"
Deploy-File "app/(tabs)/wallet" "Tabs"
Deploy-File "app/(tabs)/services" "Tabs"
Deploy-File "app/(tabs)/orders" "Tabs"
Deploy-File "app/(tabs)/profile" "Tabs"

# Bookings (6 fichiers)
Write-Host "[Bookings] 6 fichiers..." -ForegroundColor Cyan
Deploy-File "app/bookings/hotel" "Bookings"
Deploy-File "app/bookings/flight" "Bookings"
Deploy-File "app/bookings/train" "Bookings"
Deploy-File "app/bookings/bus" "Bookings"
Deploy-File "app/bookings/car" "Bookings"
Deploy-File "app/bookings/visa" "Bookings"

# Banking (4 fichiers)
Write-Host "[Banking] 4 fichiers..." -ForegroundColor Cyan
Deploy-File "app/banking/savings" "Banking"
Deploy-File "app/banking/transfer" "Banking"
Deploy-File "app/banking/virtual-card" "Banking"
Deploy-File "app/banking/withdraw" "Banking"

# Public Services (3 fichiers)
Write-Host "[Public Services] 3 fichiers..." -ForegroundColor Cyan
Deploy-File "app/public-services/documents" "Public Services"
Deploy-File "app/public-services/school" "Public Services"
Deploy-File "app/public-services/rent" "Public Services"

# Wallet (4 fichiers)
Write-Host "[Wallet] 4 fichiers..." -ForegroundColor Cyan
Deploy-File "app/wallet/recharge" "Wallet"
Deploy-File "app/wallet/withdraw" "Wallet"
Deploy-File "app/wallet/transactions" "Wallet"
Deploy-File "app/wallet/index" "Wallet"

# Main Pages (3 fichiers)
Write-Host "[Main Pages] 3 fichiers..." -ForegroundColor Cyan
Deploy-File "app/notifications" "Main"
Deploy-File "app/coins" "Main"
Deploy-File "app/billetterie" "Main"

# Modales Parentes (5 fichiers)
Write-Host "[Modales] 5 fichiers..." -ForegroundColor Cyan
Deploy-File "app/banking" "Modales"
Deploy-File "app/bookings" "Modales"
Deploy-File "app/delivery" "Modales"
Deploy-File "app/public-services" "Modales"
Deploy-File "app/supermarket" "Modales"

# Utilitaires (2 fichiers)
Write-Host "[Utilitaires] 2 fichiers..." -ForegroundColor Cyan
Deploy-File "app/+not-found" "Utilitaires"
Deploy-File "app/modal" "Utilitaires"

# Supermarket (8 fichiers)
Write-Host "[Supermarket] 8 fichiers..." -ForegroundColor Cyan
Deploy-File "app/supermarket/phones" "Supermarket"
Deploy-File "app/supermarket/electronics" "Supermarket"
Deploy-File "app/supermarket/computers" "Supermarket"
Deploy-File "app/supermarket/clothing" "Supermarket"
Deploy-File "app/supermarket/food" "Supermarket"
Deploy-File "app/supermarket/baby" "Supermarket"
Deploy-File "app/supermarket/beauty" "Supermarket"
Deploy-File "app/supermarket/clothing-complete" "Supermarket"

# Delivery (4 fichiers)
Write-Host "[Delivery] 4 fichiers..." -ForegroundColor Cyan
Deploy-File "app/delivery/package" "Delivery"
Deploy-File "app/delivery/taxi" "Delivery"
Deploy-File "app/delivery/gas" "Delivery"
Deploy-File "app/delivery/moving" "Delivery"

# Public Services supplementaires (4 fichiers)
Write-Host "[Public Services+] 4 fichiers..." -ForegroundColor Cyan
Deploy-File "app/public-services/electricity" "Public Services"
Deploy-File "app/public-services/water" "Public Services"
Deploy-File "app/public-services/phone" "Public Services"
Deploy-File "app/public-services/internet" "Public Services"

# Bookings supplementaire (1 fichier)
Write-Host "[Bookings+] 1 fichier..." -ForegroundColor Cyan
Deploy-File "app/bookings/guide" "Bookings"

# Digital Services (1 fichier)
Write-Host "[Digital] 1 fichier..." -ForegroundColor Cyan
Deploy-File "app/digital-services" "Digital"

# Banking index (1 fichier)
Write-Host "[Banking+] 1 fichier..." -ForegroundColor Cyan
Deploy-File "app/banking/index" "Banking"

Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host "Deploiement termine!" -ForegroundColor Green
Write-Host "Fichiers deployes: $count" -ForegroundColor Cyan
Write-Host "Erreurs: $errors" -ForegroundColor $(if ($errors -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($errors -eq 0) {
    Write-Host "SUCCES: Tous les fichiers ont ete deployes!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines etapes:" -ForegroundColor Yellow
    Write-Host "  1. Tester l'application: npm start" -ForegroundColor White
    Write-Host "  2. Verifier toutes les fonctionnalites" -ForegroundColor White
    Write-Host "  3. Commit: git add . && git commit -m 'feat: Deploy Design System'" -ForegroundColor White
    Write-Host ""
    Write-Host "INFO: Les fichiers originaux sont sauvegardes en .old.tsx" -ForegroundColor Cyan
    Write-Host "INFO: Pour rollback: scripts\rollback-migration-fixed.ps1" -ForegroundColor Cyan
} else {
    Write-Host "ATTENTION: Certains fichiers n'ont pas pu etre deployes" -ForegroundColor Yellow
    Write-Host "Verifiez les erreurs ci-dessus" -ForegroundColor Yellow
}

Write-Host ""
