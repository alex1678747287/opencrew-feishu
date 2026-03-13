param(
    [ValidateSet('Q', 'A', 'P', 'S')]
    [string]$Type = 'A',
    [Parameter(Mandatory = $true)]
    [string]$Goal,
    [string]$Acceptance = '定义明确的完成标准',
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
    "类型: $Type",
    "负责人: $Owner",
    "目标: $Goal",
    "验收: $Acceptance",
    "状态: $State",
    "CreatedAt: $createdAt",
    '',
    '## 背景',
    '',
    '- ',
    '',
    '## 计划',
    '',
    '- ',
    '',
    '## 最新进度',
    '',
    '_暂无_',
    '',
    '## 结项',
    '',
    '_待填写_'
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
