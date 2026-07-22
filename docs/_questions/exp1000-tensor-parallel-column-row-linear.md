---
title: 'Tensor Parallel 中 Column Parallel 和 Row Parallel Linear 怎样衔接？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '困难'
tags:
  - 'Tensor Parallel'
  - 'Column Parallel'
  - 'Row Parallel'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

以两层 MLP 为例说明第一层按输出维切、第二层按输入维切，以及一次归约。

**可以这样答：**

> 第一层按输出列切分后，每个 Rank 用完整输入计算一部分隐藏通道，不需要立即汇总。第二层把权重按对应输入行切分，各 Rank 处理自己的隐藏分片并产生部分输出，最后通过 All-Reduce 合成为完整结果。这样两层之间保持分片，避免中间激活反复 All-Gather，是经典张量并行配对。

## 常见追问

1. **反向通信与前向相同吗？** 方向会对偶变化，某些前向无需通信的层在输入梯度上需要归约。
2. **为什么切分维度必须对齐？** 第一层产生的隐藏分片要直接对应第二层本地权重输入，否则需额外重排通信。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
