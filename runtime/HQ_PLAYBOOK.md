# HQ 操作手册

这是当前单一对外可见 HQ 机器人的操作手册。

## 目标

在飞书里运行 OpenCrew 协作模式，同时又不要求一开始就拆出全部专属角色 agent。

## 默认形态

- 一个对外可见的 HQ 机器人
- 仅存在内部逻辑角色
- 对非简单任务使用 `TID`
- 使用紧凑的进度记录
- 每个完成任务保留一条结项

## 内部角色顺序

采用最小可用顺序：

1. `CoS`
   澄清请求、定义结果、设定验收标准。
2. `CTO`
   划定范围并定义下一位负责人。
3. `Builder`
   执行、验证、保留证据。
4. `Ops`
   只有在风险足够高时才介入审查。
5. `KO`
   只有在确实值得沉淀时才介入。

## 何时创建任务文件

以下情况创建任务文件：

- 任何 `A`、`P` 或 `S` 类任务
- 任何会跨越多条可见回复的任务
- 任何大概率需要进度记录的任务

纯 `Q` 类任务通常不需要任务文件。

## 本地命令

创建任务文件：

```powershell
& 'C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe' -ExecutionPolicy Bypass -File 'C:\Users\Admin\opencrew-feishu\scripts\new-hq-task.ps1' -Type A -Goal 'Summarize the latest deployment issue' -Acceptance 'One clear summary and next step'
```

输出进度块：

```powershell
& 'C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe' -ExecutionPolicy Bypass -File 'C:\Users\Admin\opencrew-feishu\scripts\emit-hq-block.ps1' -Mode checkpoint -Tid 'TID-20260313-1600-demo' -Status on_track -Completed 'Read logs and isolated the failing step' -Next 'Patch the config and re-run the health check'
```

输出结项块：

```powershell
& 'C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe' -ExecutionPolicy Bypass -File 'C:\Users\Admin\opencrew-feishu\scripts\emit-hq-block.ps1' -Mode closeout -Tid 'TID-20260313-1600-demo' -Outcome done -Changed 'Added the Feishu HQ scaffold' -Evidence 'Script syntax checked and generator dry-run passed'
```

## 对外纪律

- 不要在用户面前表演式展示内部聊天
- 优先用简短任务块，不写冗长解释
- 只有在进度记录能增加协同价值时才展示
- 所有非简单任务都必须以结项收尾
