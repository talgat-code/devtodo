param(
    [string]$BaseUrl = "http://localhost:18080"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$smokeTestPath = Join-Path $scriptDir "smoke-test.ps1"

Write-Host ""
Write-Host "[STEP] Running smoke test against $BaseUrl" -ForegroundColor Cyan

& $smokeTestPath -BaseUrl $BaseUrl
