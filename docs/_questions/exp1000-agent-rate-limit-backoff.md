---
title: 'Agent 连续调用工具遇到 Rate Limit 时，怎样退避而不拖垮整个任务？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Agent'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Rate Limit'
  - '退避'
  - '调度'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明读取 Retry-After、指数退避、共享配额协调和可降级路径。

**可以这样答：**

> 优先遵循工具返回的 Retry-After 或重置时间，没有提示时采用带抖动的指数退避。配额通常在账号或租户级共享，调度器要集中协调，不能让多个 Agent 各自猛烈重试。低优先任务可排队或降级为缓存结果，高优先任务也必须受总预算保护。超过用户可接受截止时间时应明确暂停或失败，不让模型在循环中消耗 Token。

## 常见追问

1. **为什么需要随机抖动？** 避免大量任务在同一时刻再次请求，形成同步重试风暴。
2. **换一个 API Key 绕过限流可以吗？** 不应绕过服务策略，只能按合规的独立配额和路由规则切换。

## 延伸阅读

- [ReAct](https://arxiv.org/abs/2210.03629)
