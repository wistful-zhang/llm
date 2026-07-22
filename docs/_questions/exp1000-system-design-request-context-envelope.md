---
title: '大模型请求在多个服务间传递时，统一 Context Envelope 应包含什么？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '请求上下文'
  - 'Trace'
  - '租户'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

区分可信系统元数据与不可信业务内容，并说明签名、最小传播和版本。

**可以这样答：**

> Envelope 通常包含 request_id、trace_id、认证主体、租户、地区、数据等级、截止时间和预算。身份与权限字段由入口签名或在可信网络中重新获取，不能接受模型和客户端任意修改。用户文本、检索证据和工具结果作为独立载荷，明确来源与信任级别。下游只接收自己需要的最少字段，schema 版本化并防止敏感上下文被无边界传播。

## 常见追问

1. **为什么要传播 deadline？** 下游能据剩余时间选择超时与降级，避免上游已取消后仍继续耗费资源。
2. **Trace ID 能当安全身份吗？** 不能，它只用于关联观测数据，不提供认证或授权保证。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
