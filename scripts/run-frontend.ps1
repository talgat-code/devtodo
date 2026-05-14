param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path
$frontendDir = Join-Path $repoRoot "frontend"

function Write-Step {
    param([string]$Message)

    Write-Host ""
    Write-Host "[STEP] $Message" -ForegroundColor Cyan
}

function Write-Info {
    param([string]$Message)

    Write-Host "[INFO] $Message" -ForegroundColor Yellow
}

function Assert-ExitCode {
    param([string]$Action)

    if ($LASTEXITCODE -ne 0) {
        throw "$Action failed with exit code $LASTEXITCODE."
    }
}

if (-not (Test-Path (Join-Path $frontendDir ".env")) -and (Test-Path (Join-Path $frontendDir ".env.example"))) {
    Copy-Item (Join-Path $frontendDir ".env.example") (Join-Path $frontendDir ".env")
    Write-Info "Created frontend/.env from frontend/.env.example."
}

Push-Location $frontendDir
try {
    if (-not (Test-Path "node_modules")) {
        Write-Step "Installing frontend dependencies"
        & npm install
        Assert-ExitCode "npm install"
    } else {
        Write-Info "frontend/node_modules already exists. Skipping npm install."
    }

    Write-Step "Starting frontend dev server"
    Write-Host "Frontend URL: http://localhost:5173" -ForegroundColor Green
    Write-Host "Backend API URL should be http://localhost:18080" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the frontend." -ForegroundColor Green
    & npm run dev
    Assert-ExitCode "npm run dev"
} finally {
    Pop-Location
}
