---
title: '比较两种 Transformer 架构时，怎样避免参数量或训练算力不公平？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
tags:
  - '架构消融'
  - '实验设计'
  - 'FLOPs'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

区分等参数、等训练 FLOPs、等延迟三种比较口径，并要求完整训练配方。

**可以这样答：**

> 等参数不代表等计算，MoE、Attention 变体和不同宽深比的每 Token FLOPs 可能差很多。可信比较至少要报告训练 Token、实际 FLOPs、硬件时间、参数量和推理约束，并尽量只改变一个因素。若面向部署，还要补充等延迟或等显存下的质量，因为理论 FLOPs 无法覆盖通信与内核效率。

## 常见追问

1. **只跑一次训练够吗？** 小差异时不够，应使用多个 Seed 或置信区间判断是否超过训练噪声。
2. **可以沿用同一学习率吗？** 可以作为控制实验，但新架构最优超参数可能不同，最好同时报告公平调参结果。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
