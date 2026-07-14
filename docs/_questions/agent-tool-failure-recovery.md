---
title: "Agent 的工具调用失败后应该如何恢复？"
source: "公开 Agent 工程面试题整理；答案依据原论文和官方可靠性文档原创整理"
review_status: "待复习"
category: "Agent"
difficulty: "中等"
tags:
  - Retry
  - Idempotency
  - Failure Recovery
published: true
verified: true
date: 2026-07-13
---

## 核心回答

先分类失败，再决定恢复动作。参数校验错误应修正参数，权限或业务规则拒绝通常不应重试，限流、超时和部分 5xx 可在预算内退避重试；对结果未知的有副作用操作，不能直接再次执行，应先用 request/operation ID 查询真实状态。只有工具提供服务端幂等契约时，才可携带同一 idempotency key 安全重试。长任务还要持久化 Checkpoint，并为无法原子回滚的外部动作设计补偿流程。

## 展开说明

失败可分为：

- **Validation Error**：参数类型、格式或前置条件不满足，向模型返回结构化字段错误。
- **Permanent Error**：无权限、资源不存在或业务明确拒绝，停止自动重试并向用户说明。
- **Transient Error**：限流、短暂网络故障或可恢复服务错误，使用有限次数的指数退避与抖动。
- **Ambiguous Outcome**：请求可能已成功但响应丢失，先按 request_id 查询状态，避免重复付款或发送。

每次重试都要消耗步骤和时间预算，并记录原错误。模型反思可以帮助修改计划，但不能替代错误分类、幂等控制和真实状态核验。

## 工程实践

工具返回统一错误码、retryable 标记和建议等待时间。对支持幂等契约的有副作用调用，使用租户绑定的 idempotency key，并由服务端原子地识别重复请求；不支持幂等的工具不能盲目自动重试。在动作前后保存 Checkpoint 和状态版本。补偿动作也可能失败，因此要支持人工接管、告警和对账，而不是宣称可以完全回滚外部世界。

## 常见追问

1. 为什么所有 5xx 都无限重试会造成更大故障？
2. 超时后怎样判断付款是否已经成功？
3. Compensation 与数据库事务回滚有什么区别？

## 一句话复习

> Agent 恢复的核心是错误分类、有限重试、幂等状态核验、Checkpoint 和必要的补偿或人工接管。

## 参考资料

- 面试题主题：[AI Engineering Interview Questions 中的 Agent 失败恢复题](https://github.com/amitshekhariitbhu/ai-engineering-interview-questions#ai-agents-and-agentic-systems)
- 技术依据：[AWS：Making Retries Safe with Idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)、[Reflexion](https://arxiv.org/abs/2303.11366)
