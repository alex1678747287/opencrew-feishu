param(
    [ValidateSet('Q', 'A', 'P', 'S')]
    [string]$Type = 'A',
    [Parameter(Mandatory = $true)]
    [string]$Goal,
    [string]$Acceptance = 'Define a concrete done state',
    [string]$Owner = 'HQ(CoS)',
    [ValidateSet('triage', 'active', 'blocked', 'waiting_approval', 'done', 'cancelled')]
    [string]$State = 'triage',
    [string]$Slug,
    [string]$OutputDir,
    [switch]$Json
)

$ErrorActionPreference = 'Stop'

function New-Slug {
    param([string]$Text)

    $value = $Text.ToLowerInvariant()
    $value = [regex]::Replace($value, '[^a-z0-9]+', '-')
    $value = $value.Trim('-')

    if ([string]::IsNullOrWhiteSpace($value)) {
        return 'task'
    }

    if ($value.Length -gt 32) {
        return $value.Substring(0, 32).Trim('-')
    }

    return $value
}

$root = Split-Path -Parent $PSScriptRoot
if (-not $OutputDir) {
    $OutputDir = Join-Path $root 'runtime\tasks'
}

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

$now = Get-Date
$timestamp = $now.ToString('yyyyMMdd-HHmm')
$slugValue = if ($Slug) { New-Slug $Slug } else { New-Slug $Goal }
$tid = "TID-$timestamp-$slugValue"
$filePath = Join-Path $OutputDir "$tid.md"
$createdAt = $now.ToString('yyyy-MM-ddTHH:mm:ssK')

$content = @(
    "# $tid",
    '',
    "TID: $tid",
    "Type: $Type",
    "Owner: $Owner",
    "Goal: $Goal",
    "Acceptance: $Acceptance",
    "State: $State",
    "CreatedAt: $createdAt",
    '',
    '## Context',
    '',
    '- ',
    '',
    '## Plan',
    '',
    '- ',
    '',
    '## Latest Checkpoint',
    '',
    '_none yet_',
    '',
    '## Closeout',
    '',
    '_open_'
)

Set-Content -LiteralPath $filePath -Value $content -Encoding UTF8

$result = [pscustomobject]@{
    tid = $tid
    path = $filePath
    type = $Type
    goal = $Goal
    acceptance = $Acceptance
    owner = $Owner
    state = $State
}

if ($Json) {
    $result | ConvertTo-Json -Depth 4
} else {
    $result
}

