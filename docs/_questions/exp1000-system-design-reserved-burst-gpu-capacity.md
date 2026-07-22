---
title: '稳定基线流量和突发流量并存时，GPU 容量应该怎样做 Reserved 与 Burst？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '容量规划'
  - 'Reserved'
  - 'Burst'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

以基线保留满足 SLO，突发池结合冷启动、排队和降级，并量化利用率成本。

**可以这样答：**

> 用历史分位负载为交互业务保留能满足 SLO 的基线副本，避免每次峰值都等待冷启动。额外流量进入预热的共享 Burst 池，或在可接受窗口内扩容，同时配合准入和优先队列。极端峰值时限制低优先请求、降低输出上限或转异步，不能仅依赖无限扩容。容量模型纳入模型加载时间、故障余量和区域限制，并定期用真实峰值校准。

## 常见追问

1. **为什么不按平均利用率扩容？** 平均值掩盖峰值与尾延迟，交互 SLO 通常需要按分位和排队模型规划。
2. **Burst 到云端其他区域可以吗？** 只有数据驻留、网络延迟和模型版本都满足策略时才可使用。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
