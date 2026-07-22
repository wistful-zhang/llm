---
title: 'Gradient Accumulation 中使用 DDP no_sync 时要注意什么？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'DDP'
  - 'no_sync'
  - '梯度累积'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明前几个 Microbatch 只累积本地梯度，最后一个才触发同步，并保证所有 Rank 步数一致。

**可以这样答：**

> no_sync 会跳过当前 Microbatch 的梯度 All-Reduce，让梯度只在本 Rank 累积。累积窗口最后一个 Microbatch 必须退出 no_sync，使包含此前累积量的梯度完成一次全局同步。所有 Rank 要使用相同窗口和控制流，异常跳过或变长 Batch 还需正确做 Token 归一化，否则同步后的梯度也有偏差。

## 常见追问

1. **整个窗口都 no_sync 会怎样？** 各 Rank 用不同本地梯度更新，参数立即分叉。
2. **no_sync 能省多少通信？** 通信次数约按累积步数下降，但最后仍传同样大小的梯度，单次带宽量不变。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
