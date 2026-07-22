---
title: 'Pre-Norm Decoder 堆完所有层后为什么通常还要再做一次 Final Norm？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Normalization'
  - 'Decoder'
  - 'LM Head'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从最后一次残差累积后的尺度和 LM Head 输入分布解释。

**可以这样答：**

> Pre-Norm 只在每个子层读取残差流前归一化，最后一次残差写回后没有后续子层替它归一化。Final Norm 为 LM Head 提供稳定的输入尺度，避免深度累积造成 Logit 幅度漂移。去掉它并非必然不能训练，但初始化、学习率和输出层通常都要重新适配。

## 常见追问

1. **Final Norm 的参数会影响词表分布吗？** 会，它对隐藏维度的缩放会改变 LM Head 各词 Logit 的相对贡献。
2. **Post-Norm 也一定需要 Final Norm 吗？** 不一定，因为每层输出已归一化，但具体架构仍可能保留它以稳定输出。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
