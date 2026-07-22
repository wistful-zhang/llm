---
title: 'Transformer 里的 Residual Stream 应该怎样理解，它为什么不只是“防止梯度消失”？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Transformer'
  - '残差连接'
  - '模型结构'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

先把残差流说成贯穿各层的共享表示通道，再分别解释前向信息保留和反向梯度路径。

**可以这样答：**

> Residual Stream 是各层读写的主表示通道，注意力和 FFN 都只向它提交增量。它让原始特征可以跨层保留，也为梯度提供较短的恒等路径。把它只理解为防梯度消失不够，因为它还决定了不同子层如何叠加、解释和干预模型内部表示。

## 常见追问

1. **为什么子层输出通常不能任意放大？** 增量过大会淹没残差流中已有信息，并使深层方差和梯度尺度失控。
2. **模型编辑为什么常关注 Residual Stream？** 很多语义特征沿残差流传播，在特定层读写它能观察或改变后续预测。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
