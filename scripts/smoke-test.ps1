param(
    [string]$BaseUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step {
    param([string]$Message)

    Write-Host ""
    Write-Host "[STEP] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)

    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Failure {
    param(
        [string]$Message,
        [System.Management.Automation.ErrorRecord]$ErrorRecord
    )

    Write-Host "[FAIL] $Message" -ForegroundColor Red

    if ($null -eq $ErrorRecord) {
        exit 1
    }

    if ($null -ne $ErrorRecord.Exception) {
        Write-Host $ErrorRecord.Exception.Message -ForegroundColor Yellow
    }

    $response = $null
    if ($ErrorRecord.Exception.PSObject.Properties.Name -contains "Response") {
        $response = $ErrorRecord.Exception.Response
    }

    if ($null -ne $response) {
        try {
            Write-Host ("HTTP {0} {1}" -f [int]$response.StatusCode, $response.StatusDescription) -ForegroundColor Yellow
        } catch {
        }

        try {
            $stream = $response.GetResponseStream()
            if ($null -ne $stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                $body = $reader.ReadToEnd()
                $reader.Close()

                if (-not [string]::IsNullOrWhiteSpace($body)) {
                    Write-Host $body -ForegroundColor Yellow
                }
            }
        } catch {
        }
    }

    exit 1
}

function Assert-HasValue {
    param(
        [string]$Name,
        [object]$Value
    )

    if ($null -eq $Value -or [string]::IsNullOrWhiteSpace([string]$Value)) {
        throw "Missing expected value: $Name"
    }
}

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )

    $request = @{
        Method      = $Method
        Uri         = "$BaseUrl$Path"
        Headers     = $Headers
        ErrorAction = "Stop"
    }

    if ($null -ne $Body) {
        $request["ContentType"] = "application/json"
        $request["Body"] = ($Body | ConvertTo-Json -Depth 10 -Compress)
    }

    return Invoke-RestMethod @request
}

try {
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $email = "tasktester_$timestamp@example.com"
    $password = "password123"

    Write-Step "Registering a test user"
    $registerResponse = Invoke-Api -Method "Post" -Path "/api/auth/register" -Body @{
        name     = "Task Tester"
        email    = $email
        password = $password
    }
    Assert-HasValue -Name "registered user id" -Value $registerResponse.id
    Write-Success "Registered user $email"

    Write-Step "Logging in"
    $loginResponse = Invoke-Api -Method "Post" -Path "/api/auth/login" -Body @{
        email    = $email
        password = $password
    }
    $token = $loginResponse.access_token
    Assert-HasValue -Name "access token" -Value $token
    $authHeaders = @{
        Authorization = "Bearer $token"
    }
    Write-Success "Logged in and received access token"

    Write-Step "Creating a project"
    $projectResponse = Invoke-Api -Method "Post" -Path "/api/projects" -Headers $authHeaders -Body @{
        title       = "Smoke Test Project"
        description = "Created by scripts/smoke-test.ps1"
        color       = "#4F46E5"
    }
    $projectID = $projectResponse.id
    Assert-HasValue -Name "project id" -Value $projectID
    Write-Success "Created project $projectID"

    Write-Step "Creating a task"
    $taskResponse = Invoke-Api -Method "Post" -Path "/api/projects/$projectID/tasks" -Headers $authHeaders -Body @{
        title = "Finish smoke test task"
    }
    $taskID = $taskResponse.id
    Assert-HasValue -Name "task id" -Value $taskID
    Write-Success "Created task $taskID"

    Write-Step "Listing tasks"
    $listResponse = Invoke-Api -Method "Get" -Path "/api/projects/$projectID/tasks" -Headers $authHeaders
    if ($null -eq $listResponse.tasks -or $listResponse.tasks.Count -lt 1) {
        throw "Task list is empty"
    }
    Write-Success ("Listed {0} task(s)" -f $listResponse.tasks.Count)

    Write-Step "Getting the task by id"
    $getTaskResponse = Invoke-Api -Method "Get" -Path "/api/tasks/$taskID" -Headers $authHeaders
    if ($getTaskResponse.id -ne $taskID) {
        throw "Fetched task id does not match the created task id"
    }
    Write-Success "Fetched task $taskID"

    Write-Step "Updating the task"
    $updateTaskResponse = Invoke-Api -Method "Patch" -Path "/api/tasks/$taskID" -Headers $authHeaders -Body @{
        title       = "Finish smoke test task (updated)"
        description = "Updated by the smoke test script"
        status      = "in_progress"
        priority    = "high"
    }
    if ($updateTaskResponse.status -ne "in_progress") {
        throw "Task status was not updated"
    }
    Write-Success "Updated task $taskID"

    Write-Step "Deleting the task"
    $deleteTaskResponse = Invoke-Api -Method "Delete" -Path "/api/tasks/$taskID" -Headers $authHeaders
    if ($deleteTaskResponse.status -ne "deleted") {
        throw "Unexpected delete response"
    }
    Write-Success "Deleted task $taskID"

    Write-Host ""
    Write-Host "Smoke test completed successfully." -ForegroundColor Green
    Write-Host "Email: $email"
    Write-Host "Project ID: $projectID"
    Write-Host "Task ID: $taskID"
} catch {
    Write-Failure -Message "Smoke test failed." -ErrorRecord $_
}
