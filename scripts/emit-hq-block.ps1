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
            '进度:',
            "- 状态: $Status",
            "- 已完成: $Completed",
            "- 下一步: $Next",
            "- 风险: $Risk",
            "- 需要人工: $NeedFromHuman"
        ) -join [Environment]::NewLine
    }
    'closeout' {
        if (-not $Tid) { throw 'Tid is required for closeout mode.' }
        @(
            "TID: $Tid",
            '结项:',
            "- 结果: $Outcome",
            "- 变更内容: $Changed",
            "- 证据: $Evidence",
            "- 剩余风险: $Risk",
            "- 下一步: $Next"
        ) -join [Environment]::NewLine
    }
    'handoff' {
        if (-not $Tid) { throw 'Tid is required for handoff mode.' }
        @(
            '交接:',
            "- 来自: $From",
            "- 交给: $To",
            "- TID: $Tid",
            "- 请求: $Ask",
            "- 约束: $Constraints",
            "- 完成标准: $DoneWhen"
        ) -join [Environment]::NewLine
    }
    'ops-review' {
        @(
            '运维审查:',
            "- 结论: $Verdict",
            "- 主要关注点: $MainConcern",
            "- 需要补救: $NeededMitigation"
        ) -join [Environment]::NewLine
    }
}
