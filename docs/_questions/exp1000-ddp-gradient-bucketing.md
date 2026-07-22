---
title: 'DDP 为什么把梯度放进 Bucket，而不是每个参数单独通信？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
tags:
  - 'DDP'
  - 'Gradient Bucket'
  - '通信'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明合并小张量降低 Collective 启动开销，并让反传过程中可逐 Bucket 启动同步。

**可以这样答：**

> 模型有大量参数张量，逐个 All-Reduce 会产生许多小通信，延迟和启动开销远高于有效带宽。Bucket 把多个梯度拼成较大连续缓冲区，达到就绪条件后一次通信。Bucket 大小太大要等更多层反传完成，重叠变差；太小又回到高启动开销，需要按网络和模型调优。

## 常见追问

1. **Bucket 顺序为什么常按反向就绪顺序重建？** 让先完成的梯度尽早凑满 Bucket 并与剩余反传重叠。
2. **参数注册顺序会影响性能吗？** 会影响梯度进入 Bucket 的布局和等待关系，尤其在自定义模型中。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
