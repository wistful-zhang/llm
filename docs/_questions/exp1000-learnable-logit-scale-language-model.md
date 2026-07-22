---
title: '语言模型输出层引入可学习 Logit Scale 会影响什么？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'LM Head'
  - 'Logit Scale'
  - '校准'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

联系 Softmax 温度、交叉熵梯度和概率校准，说明尺度不可无限增大。

**可以这样答：**

> 把 LM Head Logit 乘以可学习尺度等价于让模型调整输出温度，尺度越大分布越尖锐。训练可能利用它降低已分对样本的交叉熵，但过大时 Softmax 饱和、错误类别梯度极端，并造成置信度过高。实际常约束尺度、做 Soft-Cap，或把校准留给训练后的温度缩放。

## 常见追问

1. **推理 temperature 与训练 Logit Scale 相同吗？** 数学上都缩放 Logit，但前者由调用者临时控制，后者已参与参数优化。
2. **尺度变大会提高准确率吗？** 不保证，它主要改变概率尖锐度，排序不变时贪心准确率也不会改变。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
