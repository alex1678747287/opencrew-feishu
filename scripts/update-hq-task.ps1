param(
    [Parameter(Mandatory = $true)]
    [string]$Tid,
    [Parameter(Mandatory = $true)]
    [ValidateSet('checkpoint', 'closeout', 'handoff', 'ops-review', 'edit-metadata', 'toggle-plan', 'approve', 'reject')]
    [string]$Mode,
    [string]$TasksDir,
    [string]$Type,
    [string]$Priority,
    [string]$Owner,
    [string]$Goal,
    [string]$Acceptance,
    [string]$DependsOn,
    [string]$HumanGate,
    [string[]]$Plan,
    [int]$Index = -1,
    [string]$Done,
    [string]$Status = 'on_track',
    [string]$Completed = 'none',
    [string]$Next = 'none',
    [string]$Risk = 'none',
    [string]$NeedFromHuman = 'none',
    [string]$Outcome = 'done',
    [string]$Changed = 'none',
    [string]$Evidence = 'none',
    [string]$From = 'CoS',
    [string]$To = 'CTO',
    [string]$Ask = 'none',
    [string]$Constraints = 'none',
    [string]$DoneWhen = 'none',
    [string]$Verdict = 'pass',
    [string]$MainConcern = 'none',
    [string]$NeededMitigation = 'none',
    [string]$Actor = 'Human',
    [string]$Note = 'Approved',
    [string]$Reason = 'Rejected'
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$projectRoot = if ($TasksDir) {
    Split-Path -Parent (Split-Path -Parent $TasksDir)
} else {
    $root
}

$payload = [ordered]@{
    tid = $Tid
    mode = $Mode
}

switch ($Mode) {
    'checkpoint' {
        $payload.status = $Status
        $payload.completed = $Completed
        $payload.next = $Next
        $payload.risk = $Risk
        $payload.needFromHuman = $NeedFromHuman
    }
    'closeout' {
        $payload.outcome = $Outcome
        $payload.changed = $Changed
        $payload.evidence = $Evidence
        $payload.risk = $Risk
        $payload.next = $Next
    }
    'handoff' {
        $payload.from = $From
        $payload.to = $To
        $payload.ask = $Ask
        $payload.constraints = $Constraints
        $payload.doneWhen = $DoneWhen
    }
    'ops-review' {
        $payload.verdict = $Verdict
        $payload.mainConcern = $MainConcern
        $payload.neededMitigation = $NeededMitigation
    }
    'edit-metadata' {
        if ($PSBoundParameters.ContainsKey('Type')) { $payload.type = $Type }
        if ($PSBoundParameters.ContainsKey('Priority')) { $payload.priority = $Priority }
        if ($PSBoundParameters.ContainsKey('Owner')) { $payload.owner = $Owner }
        if ($PSBoundParameters.ContainsKey('Goal')) { $payload.goal = $Goal }
        if ($PSBoundParameters.ContainsKey('Acceptance')) { $payload.acceptance = $Acceptance }
        if ($PSBoundParameters.ContainsKey('DependsOn')) { $payload.dependsOn = $DependsOn }
        if ($PSBoundParameters.ContainsKey('HumanGate')) { $payload.humanGate = $HumanGate }
        if ($PSBoundParameters.ContainsKey('Plan')) { $payload.plan = $Plan }
    }
    'toggle-plan' {
        if (-not $PSBoundParameters.ContainsKey('Index') -or $Index -lt 0) {
            throw 'Index is required for toggle-plan mode.'
        }
        $payload.index = $Index
        if ($PSBoundParameters.ContainsKey('Done')) { $payload.done = $Done }
    }
    'approve' {
        $payload.actor = $Actor
        $payload.note = $Note
        $payload.next = $Next
    }
    'reject' {
        $payload.actor = $Actor
        $payload.reason = $Reason
        $payload.next = $Next
        if ($PSBoundParameters.ContainsKey('HumanGate')) { $payload.humanGate = $HumanGate }
    }
}

$env:OPENCREW_TASK_MODULE = Join-Path $root 'app\hq-tasks.js'
$env:OPENCREW_TASK_PROJECT_ROOT = $projectRoot
$env:OPENCREW_TASK_PAYLOAD = $payload | ConvertTo-Json -Depth 8 -Compress

try {
    $nodeScript = @"
const { updateTask } = require(process.env.OPENCREW_TASK_MODULE);
const payload = JSON.parse(process.env.OPENCREW_TASK_PAYLOAD || "{}");
const result = updateTask(process.env.OPENCREW_TASK_PROJECT_ROOT, payload);
process.stdout.write(JSON.stringify(result, null, 2));
"@

    $result = $nodeScript | node -
    if ($LASTEXITCODE -ne 0) {
        throw 'node updateTask invocation failed.'
    }

    $result
}
finally {
    Remove-Item Env:OPENCREW_TASK_MODULE -ErrorAction SilentlyContinue
    Remove-Item Env:OPENCREW_TASK_PROJECT_ROOT -ErrorAction SilentlyContinue
    Remove-Item Env:OPENCREW_TASK_PAYLOAD -ErrorAction SilentlyContinue
}
