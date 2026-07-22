---
title: '长任务 API 为什么常同时提供 Polling 与 Webhook？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '工程实践'
difficulty: '简单'
study_tier: 'archive'
tags:
  - '异步任务'
  - 'Webhook'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

先用自己的话说清“异步任务结果通知”，再给出一项可检查的证据或例子；结尾别漏掉Webhook 至少一次投递会重复，客户端必须验签并幂等处理。

**可以这样答：**

> Polling 适合客户端主动掌控和简单网络，Webhook 降低无效查询并及时通知，二者共享同一任务状态机。例如，创建任务后模拟回调失败，让客户端用查询接口最终取到结果。需要注意的是，Webhook 至少一次投递会重复，客户端必须验签并幂等处理。

## 常见追问

1. **如果只保留一个要点，“异步任务结果通知”是什么？** Polling 适合客户端主动掌控和简单网络，Webhook 降低无效查询并及时通知，二者共享同一任务状态机
2. **给出一个可以复现或手工检查“异步任务结果通知”的办法。** 创建任务后模拟回调失败，让客户端用查询接口最终取到结果
3. **在哪种条件下，“异步任务结果通知”会失效或被误读？** Webhook 至少一次投递会重复，客户端必须验签并幂等处理

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
