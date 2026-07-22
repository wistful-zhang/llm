---
title: 'DistributedDataParallel 怎样保证各个 Rank 更新后参数仍然一致？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'DDP'
  - 'All-Reduce'
  - '数据并行'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

按相同初始参数、各 Rank 独立反传、梯度 All-Reduce 平均、同步优化器更新四步回答。

**可以这样答：**

> 所有 Rank 从相同参数开始，各自用不同数据算本地梯度。DDP 在反向过程中对对应梯度做 All-Reduce，通常得到全局求和后按 World Size 平均，每个 Rank 因而看到相同梯度。只要优化器状态、随机更新和 Step 也一致，各 Rank 独立执行更新后参数仍相同。

## 常见追问

1. **为什么不直接 All-Reduce 参数？** 同步梯度后相同优化器会得到相同参数，逐步同步参数会增加不必要通信。
2. **某个 Rank 跳过 Step 会怎样？** 参数和优化器状态立刻分叉，后续即使梯度同步也无法自动恢复一致。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
