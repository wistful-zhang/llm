---
title: '客户端怎样根据 429 和限额 Header 自适应节流？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '工程实践'
difficulty: '中等'
tags:
  - '限流'
  - '客户端'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

口述“自适应 API 节流”时，先回答它是什么或怎么做，再用例子落地，最后交代适用限制：Header 可能缺失或口径不同，本地估算仍需留安全余量。

**可以这样答：**

> 可以从这条主线理解：维护并发和 token 预算，读取重置时间与 Retry-After，降低发送速率并用公平队列保护不同任务。再用一个最小验证说明：在动态限额模拟器中比较固定并发与 AIMD 式调整。最后明确限制：Header 可能缺失或口径不同，本地估算仍需留安全余量。

## 常见追问

1. **请用自己的话说明“自适应 API 节流”的核心做法。** 维护并发和 token 预算，读取重置时间与 Retry-After，降低发送速率并用公平队列保护不同任务
2. **你准备怎样举例证明自己理解“自适应 API 节流”？** 在动态限额模拟器中比较固定并发与 AIMD 式调整
3. **使用“自适应 API 节流”前还要确认什么？** Header 可能缺失或口径不同，本地估算仍需留安全余量

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
