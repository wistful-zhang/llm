---
title: 'Agent 可观测性里的 Trace 应该怎样串起模型、工具和人工确认？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Agent'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Tracing'
  - '可观测性'
  - '审计'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明统一 trace_id、层级 span、版本与状态事件，同时强调敏感字段不进日志。

**可以这样答：**

> 一次用户任务使用统一 trace_id，模型调用、检索、工具、等待和人工确认分别建立父子 span。每个 span 记录版本、耗时、Token、重试、状态和错误类别，使端到端延迟与失败路径可还原。副作用操作额外记录幂等键和审批引用，但敏感正文、密钥和完整工具结果按字段脱敏。异步任务通过 trace link 关联，不应因跨队列就丢失上下文。

## 常见追问

1. **把完整 Prompt 都记录下来最方便吗？** 调试方便但隐私风险很高，应默认记录模板版本和脱敏变量，原文仅受控短期采样。
2. **Trace 和审计日志一样吗？** 不完全，Trace 偏性能与调用链，审计强调不可抵赖的主体、动作和授权，两者可关联。

## 延伸阅读

- [ReAct](https://arxiv.org/abs/2210.03629)
