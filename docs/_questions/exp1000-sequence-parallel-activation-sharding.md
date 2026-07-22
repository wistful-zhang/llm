---
title: 'Sequence Parallelism 主要切分哪些激活，为什么常与 Tensor Parallel 搭配？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Sequence Parallel'
  - 'Tensor Parallel'
  - '激活显存'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明在序列维分片 Norm、Dropout 和 Residual 等非张量并行区域，减少重复激活。

**可以这样答：**

> 传统 Tensor Parallel 在部分算子之间让每个 Rank 都保留完整序列激活，Norm、Dropout 和 Residual 因而被重复存储。Sequence Parallel 把这些区域沿序列维切开，每个 Rank 只处理一段 Token，在需要进入张量并行矩阵时通过 Reduce-Scatter 或 All-Gather 转换布局。它主要节省激活显存，通信量和布局切换是否划算取决于序列长度与并行度。

## 常见追问

1. **它与 Context Parallel 相同吗？** 不完全相同，Sequence Parallel 常针对逐 Token 算子，Context Parallel 还要分布式计算跨序列 Attention。
2. **LayerNorm 能独立按 Token 计算吗？** 可以，Norm 在隐藏维归约，每个 Token 独立，所以序列分片后无需跨 Rank 统计。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
