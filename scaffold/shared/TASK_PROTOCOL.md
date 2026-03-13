# 任务协议

## TID 格式

使用：

```text
TID-YYYYMMDD-HHMM-shortslug
```

Example:

```text
TID-20260313-1530-feishu-opencrew
```

## 必填字段

```text
TID:
类型:
负责人:
目标:
验收:
状态:
```

## 状态取值

- `triage`
- `active`
- `blocked`
- `waiting_approval`
- `done`
- `cancelled`

## 最小任务记录

```text
TID: TID-YYYYMMDD-HHMM-shortslug
类型: A
负责人: Builder
目标: 应用已确认的最小飞书适配方案
验收: 文件已生成且脚本验证通过
状态: active
```

## 存储建议

如果需要耐用的本地记录，就在专用任务目录中为每个任务创建一个文件，并只保留：

- 最新摘要
- 当前阻塞点
- 最终结项
