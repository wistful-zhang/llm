---
title: 'Transformer 的 FFN Expansion Ratio 为什么常在 3 到 4 左右？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'FFN'
  - 'Expansion Ratio'
  - '参数量'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从非线性容量、参数预算和门控结构的参数等价关系回答。

**可以这样答：**

> FFN 先扩维再压回，为每个 Token 提供高容量的非线性特征变换。扩得太小会形成容量瓶颈，太大则参数和计算迅速增加，并挤占注意力预算。门控 FFN 有三组主要矩阵，为保持与普通两矩阵 FFN 接近的参数量，隐藏维度常从 4d 调整到约 8d/3。

## 常见追问

1. **FFN 参数通常占模型大头吗？** 在标准 Dense Transformer 中通常是，具体比例取决于层数、词表和注意力配置。
2. **Expansion Ratio 各层必须一样吗？** 不必须，可以按层分配容量，但会增加架构和内核优化复杂度。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
