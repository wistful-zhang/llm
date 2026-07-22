---
title: '为什么训练前后向都能跑完，却在第一次 optimizer.step() 时 OOM？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
tags:
  - 'OOM'
  - 'Optimizer State'
  - '峰值显存'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 Adam 状态和 FP32 Master Weight 常在首次 Step 懒创建，并与尚未释放的梯度共存。

**可以这样答：**

> 很多框架在第一次 optimizer.step() 才为每个参数创建一阶、二阶状态，混合精度还可能创建 FP32 Master Weight。此时参数、梯度、激活残留和新状态同时驻留，峰值远高于纯前后向。应把优化器状态纳入显存预算，提前初始化测峰值，或使用状态分片、低精度优化器和 Offload。

## 常见追问

1. **把 Batch 降低一定能解决吗？** 只能释放激活部分，若参数加状态本身已超过显存，降到 Batch 1 也无效。
2. **为什么第二步可能不再额外涨？** 状态在第一步已分配，后续通常复用缓存，除非形状或图发生变化。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
