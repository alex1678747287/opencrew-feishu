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

function Normalize-GroupIds {
    param([object]$Value)

    if ($Value -is [System.Array]) {
        $items = @($Value)
    } else {
        $items = @(([string]$Value) -split "(?:`r`n|`n|[,;，；])")
    }

    $normalized = New-Object System.Collections.Generic.List[string]
    foreach ($item in $items) {
        $text = ([string]$item) -replace '^feishu:', ''
        $text = $text.Trim()
        if ($text -and -not $normalized.Contains($text)) {
            $normalized.Add($text) | Out-Null
        }
    }

    return @($normalized)
}

function Quote-ArrayLiteral {
    param([string[]]$Values)

    $items = @($Values | ForEach-Object { Quote-Single $_ })
    return '@(' + ($items -join ', ') + ')'
}

$root = Split-Path -Parent $PSScriptRoot
$scaffoldRoot = Join-Path $root 'scaffold'

if (-not $OutputPath) {
    $OutputPath = Join-Path $root 'generated\apply-opencrew-feishu-core.ps1'
}

$agents = @(
    @{ Id = 'cos'; Workspace = (Join-Path $scaffoldRoot 'cos'); Bindings = (Normalize-GroupIds $CosBinding) },
    @{ Id = 'cto'; Workspace = (Join-Path $scaffoldRoot 'cto'); Bindings = (Normalize-GroupIds $CtoBinding) },
    @{ Id = 'builder'; Workspace = (Join-Path $scaffoldRoot 'builder'); Bindings = (Normalize-GroupIds $BuilderBinding) }
)

if ($IncludeKo -or $KoBinding) {
    $agents += @{ Id = 'ko'; Workspace = (Join-Path $scaffoldRoot 'ko'); Bindings = (Normalize-GroupIds $KoBinding) }
}

if ($IncludeOps -or $OpsBinding) {
    $agents += @{ Id = 'ops'; Workspace = (Join-Path $scaffoldRoot 'ops'); Bindings = (Normalize-GroupIds $OpsBinding) }
}

$lines = @()
$lines += '$ErrorActionPreference = ''Stop'''
$lines += '$openclawCmd = ' + (Quote-Single $OpenClawCmd)
$lines += '$openclawHome = if ($env:OPENCLAW_HOME) { $env:OPENCLAW_HOME } else { Join-Path $env:USERPROFILE ''.openclaw'' }'
$lines += '$configPath = Join-Path $openclawHome ''openclaw.json'''
$lines += 'if (-not (Test-Path $configPath)) { throw "openclaw config not found: $configPath" }'
$lines += '$raw = & $openclawCmd agents list --json'
$lines += 'if ($LASTEXITCODE -ne 0) { throw ''openclaw agents list failed'' }'
$lines += '$existing = @{}'
$lines += '$parsed = $raw | ConvertFrom-Json'
$lines += 'foreach ($item in $parsed) { $existing[$item.id] = $true }'
$lines += '$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json'
$lines += 'if (-not $config.PSObject.Properties[''bindings'']) {'
$lines += '    Add-Member -InputObject $config -MemberType NoteProperty -Name bindings -Value @()'
$lines += '}'
$lines += 'function Set-FeishuGroupBindings {'
$lines += '    param('
$lines += '        [Parameter(Mandatory = $true)][pscustomobject]$Config,'
$lines += '        [Parameter(Mandatory = $true)][string]$AgentId,'
$lines += '        [Parameter(Mandatory = $true)][string[]]$GroupIds'
$lines += '    )'
$lines += ''
$lines += '    $normalizedGroupIds = @('
$lines += '        $GroupIds'
$lines += '        | Where-Object { $null -ne $_ -and $_.ToString().Trim() -ne '''' }'
$lines += '        | ForEach-Object { $_.ToString().Trim() }'
$lines += '        | Select-Object -Unique'
$lines += '    )'
$lines += '    if ($normalizedGroupIds.Count -eq 0) {'
$lines += '        return'
$lines += '    }'
$lines += ''
$lines += '    $targetGroupLookup = @{}'
$lines += '    foreach ($GroupId in $normalizedGroupIds) {'
$lines += '        $targetGroupLookup[$GroupId] = $true'
$lines += '    }'
$lines += ''
$lines += '    $bindings = @()'
$lines += '    if ($null -ne $Config.bindings) {'
$lines += '        $bindings = @($Config.bindings)'
$lines += '    }'
$lines += ''
$lines += '    $Config.bindings = @('
$lines += '        $bindings | Where-Object {'
$lines += '            $match = $_.match'
$lines += '            if ($null -eq $match) {'
$lines += '                $true'
$lines += '            } elseif ($match.channel -ne ''feishu'') {'
$lines += '                $true'
$lines += '            } else {'
$lines += '                $sameAgent = $_.agentId -eq $AgentId'
$lines += '                $legacyAccountBinding = $null -ne $match.accountId -and $targetGroupLookup.ContainsKey($match.accountId)'
$lines += '                $sameGroupPeer = $null -ne $match.peer -and $match.peer.kind -eq ''group'' -and $null -ne $match.peer.id -and $targetGroupLookup.ContainsKey($match.peer.id)'
$lines += '                -not ($sameAgent -or $legacyAccountBinding -or $sameGroupPeer)'
$lines += '            }'
$lines += '        }'
$lines += '    )'
$lines += ''
$lines += '    foreach ($GroupId in $normalizedGroupIds) {'
$lines += '        $Config.bindings += [pscustomobject]@{'
$lines += '            agentId = $AgentId'
$lines += '            match = [pscustomobject]@{'
$lines += '                channel = ''feishu'''
$lines += '                peer = [pscustomobject]@{'
$lines += '                    kind = ''group'''
$lines += '                    id = $GroupId'
$lines += '                }'
$lines += '            }'
$lines += '        }'
$lines += '    }'
$lines += '}'

foreach ($agent in $agents) {
    $id = $agent.Id
    $workspace = $agent.Workspace
    $bindings = @($agent.Bindings)
    $addCommand = "& `$openclawCmd agents add $id --workspace " + (Quote-Single $workspace) + ' --non-interactive'

    $lines += ''
    $lines += "if (-not `$existing.ContainsKey(" + (Quote-Single $id) + ')) {'
    $lines += '    Write-Host ' + (Quote-Single ("adding agent $id"))
    $lines += '    ' + $addCommand
    $lines += "    if (`$LASTEXITCODE -ne 0) { throw 'failed to add $id' }"
    $lines += '} else {'
    $lines += '    Write-Host ' + (Quote-Single ("agent $id already exists"))
    $lines += '}'
    if ($bindings.Count -gt 0) {
        $lines += 'Set-FeishuGroupBindings -Config $config -AgentId ' + (Quote-Single $id) + ' -GroupIds ' + (Quote-ArrayLiteral $bindings)
        $lines += 'Write-Host ' + (Quote-Single ("bound $id to $($bindings.Count) feishu session(s)"))
    }
}

$lines += ''
$lines += '$configJson = $config | ConvertTo-Json -Depth 20'
$lines += '$utf8NoBom = New-Object System.Text.UTF8Encoding($false)'
$lines += '[System.IO.File]::WriteAllText($configPath, $configJson, $utf8NoBom)'
$lines += 'Write-Host (''updated bindings in '' + $configPath)'
$lines += '$restartExitCode = 0'
$lines += 'try {'
$lines += '    $restartOutput = & $openclawCmd gateway restart 2>&1'
$lines += '    $restartExitCode = $LASTEXITCODE'
$lines += '} catch {'
$lines += '    $restartOutput = $_'
$lines += '    $restartExitCode = 1'
$lines += '}'
$lines += 'if ($restartExitCode -eq 0) {'
$lines += '    Write-Host ''gateway restarted'''
$lines += '} else {'
$lines += '    Write-Warning ''failed to restart gateway automatically; run `openclaw gateway restart` manually.'''
$lines += '}'
$lines += 'Write-Host ''done'''

$outputDir = Split-Path -Parent $OutputPath
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

Set-Content -LiteralPath $OutputPath -Value $lines -Encoding UTF8
Write-Host "wrote $OutputPath"
