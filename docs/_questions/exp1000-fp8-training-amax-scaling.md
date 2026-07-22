---
title: 'FP8 训练中的 Amax History 和 Scale 是怎样配合的？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'FP8'
  - 'Amax'
  - 'Scaling'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明用近期绝对最大值估计动态范围，并预留 Margin 避免瞬时溢出。

**可以这样答：**

> FP8 动态范围和精度有限，张量通常先乘 Scale 映射到可表示区间。Amax History 记录近期若干步的绝对最大值，用它计算下一阶段 Scale，避免只被单步噪声支配。历史太慢会跟不上分布变化，太快又易抖动；还需设置 Margin、分别缩放激活和梯度，并保留高精度累加。

## 常见追问

1. **为什么不能每个元素一个 Scale？** 元数据和计算开销过高，常按张量、通道或块做折中。
2. **E4M3 与 E5M2 怎么选？** E4M3 精度更高范围较小，E5M2 范围更大，梯度等高动态范围张量常偏向后者。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
