---
title: '实现 Causal Mask 时最常见的 Off-by-One 错误是什么？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Causal Mask'
  - 'Label Shift'
  - '调试'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把输入位置、目标位置和是否允许看自身分清，并给出最小序列测试。

**可以这样答：**

> 标准自回归训练中位置 t 的隐藏状态可以读取输入 Token x_t，但标签是 x_{t+1}，所以 Mask 通常允许对角线。若标签未右移却仍允许对角线，模型会直接看到答案；若正确右移后又屏蔽对角线，则无故少看一个已知 Token。最可靠的检查是用三四个不同 Token 构造小矩阵，逐格验证可见关系和标签对齐。

## 常见追问

1. **Loss 很快接近零可能是什么信号？** 要优先怀疑标签泄漏、Mask 方向错误或输入和标签没有正确 Shift。
2. **不同框架的 is_causal 语义完全一致吗？** 不一定，布尔 Mask 的真值含义和对齐规则可能不同，必须看接口文档并做小测试。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
