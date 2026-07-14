---
title: "如何设计可取消、可恢复的异步大模型长任务系统？"
source: "公开 AI 系统设计面试题；依据后台任务与持久工作流官方文档原创整理"
review_status: "待复习"
category: "系统设计"
difficulty: "中等"
tags:
  - 异步任务
  - Checkpoint
  - 幂等性
published: true
verified: true
date: 2026-07-13
---

## 核心回答

提交接口先完成鉴权、配额和参数校验，写入任务记录后立即返回 job ID；队列只传任务引用，worker 从持久状态读取固定的输入与发布版本。任务状态至少包含 queued、running、succeeded、failed、cancelling、cancelled，并带单调版本号。长步骤保存 checkpoint，worker 用 lease/心跳声明所有权；超时后任务可以重放，因此外部副作用必须使用幂等键或去重表，不能假设消息系统提供端到端 exactly-once。

用户通过轮询、流式事件或签名 webhook 获得进度。取消是协作式的：控制面写取消意图，worker 在安全点停止后续模型与工具调用，清理租约并保存可解释的最终状态。

## 展开说明

关键设计点包括：

- **提交幂等**：客户端重试同一 idempotency key 应返回原 job，而不是重复计费和执行。
- **版本固定**：模型、Prompt、工具 Schema 与输入对象版本在创建时冻结，恢复任务不能悄悄换到最新版本。
- **预算与截止时间**：设置最大 token、步骤、墙钟时间和费用；每个子调用共享剩余预算，而不是各自完整重试。
- **结果存储**：大结果进入对象存储，任务表只存位置、摘要、校验和与保留期；下载继续按原用户鉴权。
- **故障语义**：区分可重试基础设施错误、确定性参数错误和需要人工处理的业务冲突，进入有界重试或死信队列。

进度百分比若无法可靠估计，应报告已完成阶段和最近心跳，避免伪精确。

## 工程实践

采用事务 outbox 或等价机制保证“任务记录已写入”和“待执行事件可见”不会只完成一半。故障注入覆盖 worker 被杀、重复投递、模型超时、取消与完成竞态、webhook 重放和对象过期。指标包括排队时长、运行时长、各阶段重试、恢复次数、取消生效延迟、每成功任务成本和死信数量。

## 常见追问

1. 为什么队列消费成功不等于业务只执行一次？
2. 任务取消与 worker 完成同时发生时，状态怎样收敛？
3. 恢复长任务时为什么必须固定模型和 Prompt 版本？

## 一句话复习

> 长任务用持久状态机、幂等副作用、租约与 checkpoint 抵抗重放，并让预算、取消和版本贯穿全程。

## 参考资料

- 面试题来源：[AI Engineering Interview Questions 的同步/异步推理与长流程题](https://github.com/amitshekhariitbhu/ai-engineering-interview-questions)
- 官方依据：[OpenAI Background Mode](https://developers.openai.com/api/docs/guides/background)、[Temporal Workflow 文档](https://docs.temporal.io/workflows)
