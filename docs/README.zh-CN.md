# OpenCrew Feishu 使用文档

`opencrew-feishu` 是一个运行在本地的控制台项目，用来把 OpenCrew 风格的多角色协作流程接到 OpenClaw 和飞书上。

它的核心目标不是直接做“很多公开机器人”，而是先用一个可见的 HQ 入口，在内部通过 `CoS`、`CTO`、`Builder`、`KO`、`Ops` 等角色完成任务编排、状态流转和收口。

## 适用场景

适合下面这类场景：

- 你已经在用 OpenClaw，需要把角色协作接到飞书群
- 你希望先保留一个对外可见的主机器人，而不是一开始就拆成多个机器人
- 你希望任务状态可追踪、可审计，而不是散落在聊天记录里
- 你需要一个本地 UI 来管理角色、群绑定、脚手架生成和运行时看板

## 主要能力

- 本地 UI 配置角色和飞书群 ID
- 生成 OpenClaw 角色工作区和应用脚本
- 用 `TID` 任务文件替代线程隔离
- 支持 `handoff`、`checkpoint`、`approve`、`reject`、`ops-review`、`closeout`
- 用追加式 `## Event Log` 保留完整审计轨迹
- 在运行时看板中展示当前负责人、状态、依赖链和最近事件

## 安装与启动

前置要求：

- Windows PowerShell
- Node.js
- 本机已安装 OpenClaw

启动本地 UI：

```powershell
npm start
```

默认访问地址：

```text
http://127.0.0.1:3210
```

运行测试：

```powershell
npm test
```

## 第一次使用

推荐按这个顺序上手：

1. 启动本地 UI。
2. 检查默认角色配置是否符合你的协作方式。
3. 给需要启用的角色填写飞书群 ID。
4. 保存本地配置。
5. 生成 apply 脚本和角色工作区。
6. 在确认群绑定无误后执行生成脚本。
7. 用 UI 或 PowerShell 创建第一条 `TID` 任务。
8. 在 runtime board 中观察任务流转。

## 工作流说明

### 1. 单 HQ 模式

当前最推荐的是单 HQ 模式：

- 飞书里只有一个对外可见的 HQ 说话
- 内部逻辑角色继续存在
- 任务通过 `runtime/tasks/<TID>.md` 串起来
- 本地 runtime board 负责还原当前任务状态

这种方式的优点是：

- 不需要一开始就维护多个公开机器人
- 不依赖飞书线程模型来隔离任务
- 所有关键状态都能落到文件和事件日志里

### 2. TID 任务文件

每个任务文件通常包含：

- 头部元信息
- `## Context`
- `## Plan`
- `## Latest Progress`
- `## Event Log`
- `## Closeout`

其中几个关键字段：

- `Priority`: `P0` 到 `P3`
- `DependsOn`: 上游依赖任务
- `HumanGate`: 需要人类批准或输入的边界

### 3. 关键动作

任务流转主要通过这些动作完成：

- `handoff`
  把任务交给下一个角色，说明 ask、constraints 和 done-when
- `checkpoint`
  回写当前进度、下一步、风险和人类输入需求
- `approve`
  只在任务确实处于 `waiting_approval` 时有效
- `reject`
  同样只在 `waiting_approval` 时有效
- `ops-review`
  用于运行风险、发布风险或流程风险审查
- `closeout`
  结束任务，进入 `done` 或 `cancelled`

### 4. 事件日志

每个任务文件里都有追加式 `## Event Log`：

- 旧事件不会被重写
- 运行时看板会优先根据事件日志归约状态
- 当前头部元信息仍然用于显示 `Goal`、`Acceptance`、`DependsOn` 等静态字段

这使得任务具备：

- 可审计
- 可恢复
- 可追踪状态变化原因

## UI 能做什么

本地 UI 当前可以：

- 维护内置角色和自定义角色
- 配置飞书群绑定
- 保存本地配置
- 生成 `roles/` 下的角色工作区
- 生成 `generated/` 下的 apply 脚本
- 创建新的 `TID` 任务
- 对任务执行运行时动作
- 查看依赖阻塞、当前角色、时间线和审计事件
- 用类似项目看板的方式浏览任务状态

## 目录说明

- `app/`
  服务端、本地生成器、任务引擎、运行时看板逻辑
- `ui/`
  浏览器端界面
- `runtime/`
  HQ 协议、任务规范、监督说明
- `scaffold/`
  角色模板和共享提示词资产
- `scripts/`
  PowerShell 工具脚本
- `config/`
  示例配置和本地配置输出
- `test/`
  回归测试

## 常用脚本

启动 UI：

```powershell
npm start
```

运行测试：

```powershell
npm test
```

创建任务：

```powershell
.\scripts\new-hq-task.ps1
```

更新任务动作：

```powershell
.\scripts\update-hq-task.ps1 -Tid <TID> -Mode checkpoint
```

## 开发建议

- 涉及工作流改动时，优先复用共享任务引擎，不要在 UI 或脚本里重复实现状态机
- 涉及 prompt、协议或模板文件时，尽量保持 ASCII-safe，避免 Windows 控制台编码问题
- 涉及关闭态、批准态、依赖链的逻辑时，默认把它当成兼容性敏感区域
- 修改行为后先运行 `npm test`

## 当前状态

当前仓库已经具备：

- 本地 UI
- 运行时看板
- 共享任务状态机
- 审计事件日志
- 基础回归测试

还建议继续完善：

- 仓库截图
- 示例配置演示
- 更完整的发布说明
- 多机部署和迁移文档

## 相关文档

- [`../README.md`](../README.md)
- [`../runtime/HQ_PROTOCOL.md`](../runtime/HQ_PROTOCOL.md)
- [`../runtime/HQ_SUPERVISION.md`](../runtime/HQ_SUPERVISION.md)
- [`../runtime/TASKS.md`](../runtime/TASKS.md)
