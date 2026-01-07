# Script PowerShell pour supprimer les imports et variables non utilisés
# Basé sur les erreurs TS6133 du type-check

Write-Host "🧹 Nettoyage des imports et variables non utilisés..." -ForegroundColor Cyan

# Liste des corrections à appliquer (basée sur l'output du type-check)
$corrections = @(
    # delivery/gas.tsx
    @{ File = "app\delivery\gas.tsx"; Line = 4; Remove = "useRouter" },
    
    # delivery/moving.tsx  
    @{ File = "app\delivery\moving.tsx"; Line = 2; Remove = "ScrollView" },
    @{ File = "app\delivery\moving.tsx"; Line = 4; Remove = "useRouter" },
    
    # delivery/package.tsx
    @{ File = "app\delivery\package.tsx"; Line = 2; Remove = "ScrollView" },
    @{ File = "app\delivery\package.tsx"; Line = 4; Remove = "useRouter" },
    
    # billetterie.tsx
    @{ File = "app\billetterie.tsx"; Line = 2; Remove = "ScrollView, FlatList, ActivityIndicator" },
    
    # banking/savings.tsx
    @{ File = "app\banking\savings.tsx"; Line = 18; Remove = "Section" },
    
    # banking/virtual-card.tsx
    @{ File = "app\banking\virtual-card.tsx"; Line = 2; Remove = "ScrollView, FlatList, ActivityIndicator" },
    
    # bookings/guide.tsx
    @{ File = "app\bookings\guide.tsx"; Line = 4; Remove = "Counter" }
)

Write-Host "📊 Total de corrections à appliquer : $($corrections.Count)" -ForegroundColor Yellow

# Fonction pour supprimer un import d'une ligne
function Remove-Import {
    param(
        [string]$FilePath,
        [string]$ImportToRemove
    )
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        
        # Supprimer l'import de la liste
        $imports = $ImportToRemove -split ', '
        foreach ($import in $imports) {
            $import = $import.Trim()
            
            # Pattern 1: import seul
            $content = $content -replace "import \{ $import \} from", "// REMOVED: import { $import } from"
            
            # Pattern 2: dans une liste
            $content = $content -replace ", $import,", ","
            $content = $content -replace ", $import ", " "
            $content = $content -replace " $import,", ""
        }
        
        Set-Content $FilePath -Value $content -NoNewline
        Write-Host "  ✅ $FilePath" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Fichier introuvable : $FilePath" -ForegroundColor Red
    }
}

# Appliquer les corrections
foreach ($correction in $corrections) {
    $fullPath = Join-Path $PSScriptRoot $correction.File
    Remove-Import -FilePath $fullPath -ImportToRemove $correction.Remove
}

Write-Host "`n✨ Nettoyage terminé !" -ForegroundColor Green
Write-Host "🔍 Lancez 'npm run type-check' pour vérifier les résultats" -ForegroundColor Cyan
