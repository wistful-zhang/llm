---
title: '训练流水线中，增加 Microbatch 为什么能摊薄填充与排空开销？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
tags:
  - 'Pipeline Parallel'
  - 'Microbatch'
  - 'Bubble'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

用流水线填充和排空固定开销被更多稳态 Microbatch 摊薄来解释。

**可以这样答：**

> 流水线开始时后段空闲、结束时前段空闲，填充和排空开销主要由 Stage 数决定。Microbatch 越多，中间各 Stage 同时工作的稳态区越长，固定 Bubble 被更多有效计算摊薄。数量过多会让单个 Microbatch 太小、矩阵利用率下降，并增加调度和激活管理开销。

## 常见追问

1. **Microbatch 数至少要等于 Stage 数吗？** 不是硬条件，但过少时 Bubble 很大，通常希望明显多于 Stage 数。
2. **增加 Gradient Accumulation 能增加 Microbatch 吗？** 可以把一个 Global Batch 切成更多流水线 Microbatch，但要保持有效 Batch 和归一化。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
