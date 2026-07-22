---
title: 'Softmax Attention 输出是 Value 的凸组合，这会限制表达能力吗？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Softmax Attention'
  - 'Value'
  - '表达能力'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明单头加权和的系数非负且和为一，再讲多头、投影和残差如何突破表面限制。

**可以这样答：**

> 单个 Head 的 Softmax 权重非负且和为一，所以其输出落在当前 Value 向量的凸包内。单看这一操作确实不能任意放大或做负权组合。实际 Block 还有不同 Head、V 投影、W_O、残差和 FFN，它们共同可以形成负系数与更复杂变换，因此不能把单头限制等同于整个模型限制。

## 常见追问

1. **去掉 Softmax 能获得负权重吗？** 可以，但归一化、尺度和训练稳定性都要重新设计。
2. **W_O 如何产生负组合？** 它是无非负约束的线性映射，可以对不同 Head 和通道做正负加权。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
