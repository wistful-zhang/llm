---
title: '多租户 LLM 平台怎样防止一个大客户拖慢其他租户？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '多租户'
  - 'Noisy Neighbor'
  - '配额'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从入口配额、队列公平、资源池隔离和缓存边界四层回答。

**可以这样答：**

> 入口按租户限制并发、输入输出 Token、费用和速率，突发额度使用令牌桶而非无限排队。调度器采用加权公平队列并设置单请求长度上限，关键租户可有保留容量但不能突破集群安全水位。超大或异常任务转到隔离队列，避免占满共享 KV 和 CPU。指标、缓存与日志也按租户隔离，才能准确定位和结算资源使用。

## 常见追问

1. **共享 Batch 会破坏租户隔离吗？** 计算可共享，但调度、缓存、日志和输出映射必须严格按请求隔离。
2. **客户突然大促怎么办？** 通过预留容量、提前扩容和受控突发配额处理，而不是临时取消所有限制。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
