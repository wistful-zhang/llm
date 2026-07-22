---
title: '为什么批大小增大后吞吐先升高，延迟却可能突然恶化？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '中等'
tags:
  - 'Batch'
  - '吞吐'
  - '尾延迟'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明硬件利用率、排队等待、KV 容量和饱和点，并建议画曲线找拐点。

**可以这样答：**

> 小批次无法充分利用矩阵和内存带宽，增加 Batch 通常先提高每秒 Token。为了凑批而等待会增加排队，Batch 太大后单步执行时间、KV 访问和显存压力也上升。接近容量上限时，排队会形成非线性增长，P99 可能突然恶化甚至触发 OOM。应在真实长度分布下画吞吐、TTFT 和 TPOT 曲线，选择满足 SLO 的最大有效批次而不是峰值吞吐点。

## 常见追问

1. **Continuous Batching 能消除这个问题吗？** 能减少整批同步浪费，但仍受每步 Token 预算、KV 容量和排队负载限制。
2. **离线任务怎么选 Batch？** 没有交互延迟约束时可更靠近吞吐峰值，但仍要保留 OOM 与长尾长度余量。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
