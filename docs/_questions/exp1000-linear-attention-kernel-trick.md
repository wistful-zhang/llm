---
title: 'Linear Attention 如何用 Kernel Trick 改写注意力，为什么结果不等同于 Softmax Attention？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'Linear Attention'
  - 'Kernel Trick'
  - '长序列'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

写出先算 φ(K)ᵀV 再与 φ(Q) 相乘的顺序，并说明核函数改变了归一化。

**可以这样答：**

> Linear Attention 用特征映射 φ 近似或替代 exp(q·k)，把计算顺序改成 φ(Q)(φ(K)ᵀV)，从而避免显式构造 n×n 矩阵。因矩阵乘法结合律，序列长度上的复杂度可降为线性。它使用的核、归一化和数值性质与精确 Softmax 不同，所以注意力分布与模型能力也会改变，不是无损重排。

## 常见追问

1. **因果 Linear Attention 怎样计算？** 可以维护 φ(K)ᵀV 和 φ(K) 的前缀累积状态，逐位置更新。
2. **为什么训练稳定性常是难点？** 特征映射值、分母归一化和长序列累积都可能产生极端尺度或精度误差。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
