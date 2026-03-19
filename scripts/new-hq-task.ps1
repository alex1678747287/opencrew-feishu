param(
    [ValidateSet('Q', 'A', 'P', 'S')]
    [string]$Type = 'A',
    [ValidateSet('P0', 'P1', 'P2', 'P3')]
    [string]$Priority = 'P2',
    [Parameter(Mandatory = $true)]
    [string]$Goal,
    [string]$Acceptance = 'Define a clear done condition',
    [string]$Owner = 'HQ(CoS)',
    [string[]]$DependsOn = @(),
    [string]$HumanGate = 'none',
    [string[]]$Plan = @(),
    [ValidateSet('triage', 'active', 'blocked', 'waiting_approval', 'scope_changed', 'done', 'cancelled')]
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

function Normalize-PlanLines {
    param([string[]]$Lines)

    $result = New-Object System.Collections.Generic.List[string]
    foreach ($line in @($Lines)) {
        $text = [string]$line
        if ([string]::IsNullOrWhiteSpace($text)) {
            continue
        }

        $trimmed = $text.Trim()
        if ($trimmed -match '^[-*]\s*\[(x| )\]\s*(.+)$') {
            $mark = if ($Matches[1].ToLowerInvariant() -eq 'x') { 'x' } else { ' ' }
            $result.Add("- [$mark] $($Matches[2].Trim())") | Out-Null
            continue
        }

        if ($trimmed -match '^[-*]\s+(.+)$') {
            $result.Add("- [ ] $($Matches[1].Trim())") | Out-Null
            continue
        }

        $result.Add("- [ ] $trimmed") | Out-Null
    }

    if ($result.Count -eq 0) {
        $result.Add('- [ ] Define the first executable step') | Out-Null
    }

    return @($result)
}

function Normalize-DependsOn {
    param([string[]]$Values)

    $result = New-Object System.Collections.Generic.List[string]
    foreach ($value in @($Values)) {
        foreach ($item in ([string]$value).Split("`n")) {
            foreach ($part in $item.Split(',', ';', '，', '；')) {
                $text = $part.Trim()
                if (-not $text) {
                    continue
                }
                if ($text -ieq 'none') {
                    continue
                }
                if (-not $result.Contains($text)) {
                    $result.Add($text) | Out-Null
                }
            }
        }
    }

    return @($result)
}

$root = Split-Path -Parent $PSScriptRoot
if (-not $OutputDir) {
    $OutputDir = Join-Path $root 'runtime\tasks'
}

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

$dependsOnList = Normalize-DependsOn -Values $DependsOn
$planLines = Normalize-PlanLines -Lines $Plan
$now = Get-Date
$timestamp = $now.ToString('yyyyMMdd-HHmm')
$slugValue = if ($Slug) { New-Slug $Slug } else { New-Slug $Goal }
$tid = "TID-$timestamp-$slugValue"
$filePath = Join-Path $OutputDir "$tid.md"
$createdAt = $now.ToString('yyyy-MM-ddTHH:mm:ssK')
$dependsOnText = if ($dependsOnList.Count -gt 0) { $dependsOnList -join ', ' } else { 'none' }

$content = @(
    "# $tid",
    '',
    "TID: $tid",
    "Type: $Type",
    "Priority: $Priority",
    "Owner: $Owner",
    "Goal: $Goal",
    "Acceptance: $Acceptance",
    "DependsOn: $dependsOnText",
    "HumanGate: $HumanGate",
    "State: $State",
    "CreatedAt: $createdAt",
    '',
    '## Context',
    '',
    '- ',
    '',
    '## Plan',
    ''
)
$content += $planLines
$content += @(
    '',
    '## Latest Progress',
    '',
    '_none_',
    '',
    '## Closeout',
    '',
    '_pending_'
)

Set-Content -LiteralPath $filePath -Value $content -Encoding UTF8

$result = [pscustomobject]@{
    tid = $tid
    path = $filePath
    type = $Type
    priority = $Priority
    goal = $Goal
    acceptance = $Acceptance
    owner = $Owner
    dependsOn = $dependsOnList
    humanGate = $HumanGate
    state = $State
}

if ($Json) {
    $result | ConvertTo-Json -Depth 4
} else {
    $result
}
