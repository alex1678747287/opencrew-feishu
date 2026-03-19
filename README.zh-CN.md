# OpenCrew Feishu

面向 OpenClaw + 飞书场景的本地控制台，用来运行 OpenCrew 风格的多角色协作流程。

## 项目简介

这个项目的目标不是一开始就拆成很多公开机器人，而是先保留一个对外可见的 HQ 入口，在内部通过 `CoS`、`CTO`、`Builder`、`KO`、`Ops` 等角色完成任务编排、状态流转和收口。

它提供：

- 本地 UI，用于角色配置、飞书群绑定和脚手架生成
- 单 HQ 模式，适合共享飞书群的协作方式
- 基于 `TID` 的任务文件工作流
- 运行时看板，可根据任务文件和事件日志还原当前状态
- 统一任务引擎，供 UI 和 PowerShell 脚本共同调用

## 为什么这样设计

OpenCrew 原本更接近 `channel = role`、`thread = task` 的模型。
在飞书场景里，如果只有一个可见机器人，这种模型不能直接套用。

这个项目采用更稳妥的方式：

- 对外只保留一个 HQ 发言入口
- 内部角色继续协作
- 用 `runtime/tasks/<TID>.md` 显式隔离任务
- 用本地控制台查看状态、依赖、审批和收口

## 核心能力

- 角色配置与飞书会话绑定
- 生成 OpenClaw 工作区和 apply 脚本
- `handoff`、`checkpoint`、`approve`、`reject`、`ops-review`、`closeout`
- 追加式 `## Event Log` 审计轨迹
- 依赖链、阻塞、待批准、范围变化的可视化
- `/api/health` 健康检查接口
- 明确的 API 错误语义：
  - `400` 请求参数不合法或校验失败
  - `404` 路由不存在或任务文件不存在
  - `409` 工作流冲突，例如错误地批准未处于 `waiting_approval` 的任务

## 快速开始

环境要求：

- Windows PowerShell
- Node.js
- 已安装 OpenClaw

启动本地 UI：

```powershell
npm start
```

默认地址：

```text
http://127.0.0.1:3210
```

运行测试：

```powershell
npm test
```

健康检查：

```text
GET http://127.0.0.1:3210/api/health
```

## UI 可以做什么

- 维护内置角色和自定义角色
- 配置飞书群 ID
- 保存本地配置
- 生成 `roles/` 下的角色工作区
- 生成 `generated/` 下的 apply 脚本
- 创建新的 `TID` 任务
- 推进任务动作和审批流
- 查看依赖、审计事件、当前负责人和当前动作角色
- 手动刷新 runtime board，并看到最近一次成功刷新时间

## 工作流模型

推荐的使用方式：

1. 保持一个可见 HQ 机器人
2. 内部用逻辑角色协作
3. 用 `TID` 文件和结构化动作块隔离任务
4. 先把流程跑稳定，再决定是否拆成独立代理

关键升级点包括：

- `Priority`、`DependsOn`、`HumanGate`
- checklist 化的 `## Plan`
- append-only `## Event Log`
- 显式 `approve` / `reject`
- 关闭态任务的工作流保护
- dependency visibility 和 runtime board

## 目录结构

- `app/`
  本地服务端、生成器、任务引擎和 runtime board
- `ui/`
  浏览器端界面
- `runtime/`
  HQ 协议、操作手册、监督说明和任务规范
- `scaffold/`
  角色模板和共享提示词资产
- `scripts/`
  PowerShell 工具脚本
- `config/`
  示例配置和本地配置
- `test/`
  回归测试和集成测试

## 关键文件

- [`runtime/HQ_PROTOCOL.md`](runtime/HQ_PROTOCOL.md)
- [`runtime/HQ_PLAYBOOK.md`](runtime/HQ_PLAYBOOK.md)
- [`runtime/HQ_SUPERVISION.md`](runtime/HQ_SUPERVISION.md)
- [`runtime/TASKS.md`](runtime/TASKS.md)
- [`scripts/new-hq-task.ps1`](scripts/new-hq-task.ps1)
- [`scripts/update-hq-task.ps1`](scripts/update-hq-task.ps1)
- [`scripts/emit-opencrew-feishu-core.ps1`](scripts/emit-opencrew-feishu-core.ps1)

## 当前状态

- 本地 UI 可用
- 任务引擎和 runtime board 已实现
- `/api/health` 和结构化错误语义已补齐
- 工作流 guardrails 已有测试覆盖
- 仓库已使用 MIT 许可证公开

## 相关文档

- 英文版说明：[`README.md`](README.md)
- 更详细的中文使用文档：[`docs/README.zh-CN.md`](docs/README.zh-CN.md)
