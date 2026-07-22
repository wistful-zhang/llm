---
title: 'Interleaved Pipeline 中的 Virtual Stage 为什么能减少 Bubble？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '困难'
tags:
  - 'Pipeline Parallel'
  - 'Virtual Stage'
  - 'Interleaving'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明每张 GPU 持有多个不相邻模型 Chunk，调度交错后缩短有效流水线间隔。

**可以这样答：**

> 普通流水线每个 Rank 持有一个连续 Stage，依赖间隔较长。Interleaving 把每个物理 Rank 再切成多个 Virtual Stage，并按模型顺序交错放置，使 Rank 在等待一个 Chunk 通信时可计算另一个 Chunk。它减少 Bubble，但增加点对点通信次数、调度复杂度和同时驻留激活，模型层数还要满足切分约束。

## 常见追问

1. **Virtual Stage 越多越好吗？** 不是，通信与调度开销会上升，细 Chunk 也可能降低算子效率。
2. **它能解决 Stage 计算不均吗？** 交错有助于摊平部分差异，但重层和 Embedding 仍需专门做成本均衡。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
