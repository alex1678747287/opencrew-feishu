param(
    [string]$OutputPath,
    [string]$OpenClawCmd = 'C:\Program Files\nodejs\openclaw.cmd',
    [string]$CosBinding,
    [string]$CtoBinding,
    [string]$BuilderBinding,
    [switch]$IncludeKo,
    [string]$KoBinding,
    [switch]$IncludeOps,
    [string]$OpsBinding
)

$ErrorActionPreference = 'Stop'

function Quote-Single {
    param([string]$Value)
    return "'" + $Value.Replace("'", "''") + "'"
}

$root = Split-Path -Parent $PSScriptRoot
$scaffoldRoot = Join-Path $root 'scaffold'

if (-not $OutputPath) {
    $OutputPath = Join-Path $root 'generated\apply-opencrew-feishu-core.ps1'
}

$agents = @(
    @{ Id = 'cos'; Workspace = (Join-Path $scaffoldRoot 'cos'); Binding = $CosBinding },
    @{ Id = 'cto'; Workspace = (Join-Path $scaffoldRoot 'cto'); Binding = $CtoBinding },
    @{ Id = 'builder'; Workspace = (Join-Path $scaffoldRoot 'builder'); Binding = $BuilderBinding }
)

if ($IncludeKo -or $KoBinding) {
    $agents += @{ Id = 'ko'; Workspace = (Join-Path $scaffoldRoot 'ko'); Binding = $KoBinding }
}

if ($IncludeOps -or $OpsBinding) {
    $agents += @{ Id = 'ops'; Workspace = (Join-Path $scaffoldRoot 'ops'); Binding = $OpsBinding }
}

$lines = @()
$lines += '$ErrorActionPreference = ''Stop'''
$lines += '$openclawCmd = ' + (Quote-Single $OpenClawCmd)
$lines += '$raw = & $openclawCmd agents list --json'
$lines += 'if ($LASTEXITCODE -ne 0) { throw ''openclaw agents list failed'' }'
$lines += '$existing = @{}'
$lines += '$parsed = $raw | ConvertFrom-Json'
$lines += 'foreach ($item in $parsed) { $existing[$item.id] = $true }'

foreach ($agent in $agents) {
    $id = $agent.Id
    $workspace = $agent.Workspace
    $binding = $agent.Binding
    $addCommand = "& `$openclawCmd agents add $id --workspace " + (Quote-Single $workspace) + ' --non-interactive'
    if ($binding) {
        $addCommand += ' --bind ' + (Quote-Single ("feishu:$binding"))
    }

    $lines += ''
    $lines += "if (-not `$existing.ContainsKey(" + (Quote-Single $id) + ')) {'
    $lines += '    Write-Host ' + (Quote-Single ("adding agent $id"))
    $lines += '    ' + $addCommand
    $lines += "    if (`$LASTEXITCODE -ne 0) { throw 'failed to add $id' }"
    if ($binding) {
        $lines += '} else {'
        $lines += '    Write-Host ' + (Quote-Single ("binding existing agent $id"))
        $lines += "    & `$openclawCmd agents bind --agent $id --bind " + (Quote-Single ("feishu:$binding"))
        $lines += "    if (`$LASTEXITCODE -ne 0) { throw 'failed to bind $id' }"
        $lines += '}'
    } else {
        $lines += '}'
    }
}

$lines += ''
$lines += 'Write-Host ''done'''

$outputDir = Split-Path -Parent $OutputPath
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

Set-Content -LiteralPath $OutputPath -Value $lines -Encoding UTF8
Write-Host "wrote $OutputPath"
