# ==============================================================================
# XEROPARTS - 1-CLICK GITHUB SYNC & LIVE DEPLOYMENT SCRIPT
# ==============================================================================

param(
    [string]$Message = "Update XeroParts store catalog & features"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   XEROPARTS - GITHUB LIVE SYNC & DEPLOYMENT" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Set Git PATH if not present
$gitPath = "$env:LOCALAPPDATA\Programs\Git\cmd"
if ($env:Path -notlike "*$gitPath*") {
    $env:Path = "$env:Path;$gitPath"
}

# 1. Check if git repo is initialized
if (-not (Test-Path ".git")) {
    Write-Host "[1/4] Initializing Git repository..." -ForegroundColor Green
    git init -b main
} else {
    Write-Host "[1/4] Git repository verified." -ForegroundColor Green
}

# 2. Check remote origin
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host ""
    Write-Host "⚠️  GitHub Remote repository not connected yet!" -ForegroundColor Yellow
    Write-Host "Please enter your GitHub repository URL (e.g. https://github.com/your-username/xeroparts.git):" -ForegroundColor White
    $repoUrl = Read-Host "Repository URL"
    if ($repoUrl) {
        git remote add origin $repoUrl
        Write-Host "✅ Connected to: $repoUrl" -ForegroundColor Green
    } else {
        Write-Host "❌ Skipping remote push. Local changes saved." -ForegroundColor Red
        git add .
        git commit -m $Message
        exit
    }
}

# 3. Add and commit changes
Write-Host "[2/4] Staging files..." -ForegroundColor Green
git add .

Write-Host "[3/4] Committing changes with message: '$Message'..." -ForegroundColor Green
git commit -m "$Message"

# 4. Push to GitHub
Write-Host "[4/4] Pushing changes to GitHub main branch..." -ForegroundColor Green
git branch -M main
git push -u origin main

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 SUCCESS! Changes pushed to GitHub successfully." -ForegroundColor Green
Write-Host "Your website will automatically go live via GitHub Pages!" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
