param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('checkpoint', 'closeout', 'handoff', 'ops-review')]
    [string]$Mode,
    [string]$Tid,
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
    [string]$NeededMitigation = 'none'
)

$ErrorActionPreference = 'Stop'

switch ($Mode) {
    'checkpoint' {
        if (-not $Tid) { throw 'Tid is required for checkpoint mode.' }
        @(
            "TID: $Tid",
            'Checkpoint:',
            "- Status: $Status",
            "- Completed: $Completed",
            "- Next: $Next",
            "- Risk: $Risk",
            "- Need from human: $NeedFromHuman"
        ) -join [Environment]::NewLine
    }
    'closeout' {
        if (-not $Tid) { throw 'Tid is required for closeout mode.' }
        @(
            "TID: $Tid",
            'Closeout:',
            "- Outcome: $Outcome",
            "- What changed: $Changed",
            "- Evidence: $Evidence",
            "- Risk: $Risk",
            "- Next: $Next"
        ) -join [Environment]::NewLine
    }
    'handoff' {
        if (-not $Tid) { throw 'Tid is required for handoff mode.' }
        @(
            'Handoff:',
            "- From: $From",
            "- To: $To",
            "- TID: $Tid",
            "- Ask: $Ask",
            "- Constraints: $Constraints",
            "- Done when: $DoneWhen"
        ) -join [Environment]::NewLine
    }
    'ops-review' {
        @(
            'Ops Review:',
            "- Verdict: $Verdict",
            "- Main concern: $MainConcern",
            "- Needed mitigation: $NeededMitigation"
        ) -join [Environment]::NewLine
    }
}
