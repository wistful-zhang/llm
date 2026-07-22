---
title: '改变 Decoder Block 内 Norm、Attention、FFN 的顺序时，为什么不能只迁移原权重？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Decoder Block'
  - '权重迁移'
  - 'Normalization'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从每个模块接收到的输入分布和残差语义发生变化来回答。

**可以这样答：**

> 模块顺序决定 Attention 和 FFN 读取的是原残差、归一化表示还是已被另一分支更新的表示。即使矩阵形状相同，交换顺序后输入分布和功能位置都变了，原权重不再对应相同计算。可以用原权重初始化后继续训练，但应预期短期 Loss 跳变，并重新检查残差尺度与学习率。

## 常见追问

1. **Attention 和 FFN 可以直接交换吗？** 形状上通常可以，功能上会改变本层的信息流，需要再训练验证。
2. **为什么小规模模型试验可能看不出问题？** 浅模型的尺度累积和优化难度较弱，结论未必能外推到大规模深网络。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
