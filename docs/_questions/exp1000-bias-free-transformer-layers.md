---
title: '很多现代 LLM 为什么在线性层里去掉 Bias？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '简单'
study_tier: 'extended'
tags:
  - 'Linear Bias'
  - '模型结构'
  - 'Normalization'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

回答参数节省不是重点，要联系归一化、冗余自由度和实现简化。

**可以这样答：**

> 在大量线性层后接归一化或与其他投影组合时，Bias 提供的平移自由度常可被后续参数吸收。去掉它能稍微减少参数、内存访问和算子分支，也让张量并行实现更简单。它不是普遍定律，输出层、门控或特定架构仍可能从 Bias 获益，需要以消融为准。

## 常见追问

1. **去掉 Bias 会明显减少参数量吗？** 通常不会，相比 d×d 权重，长度为 d 的 Bias 很小。
2. **Norm 的可学习偏置也都能删吗？** 不一定，RMSNorm 常只有缩放，而 LayerNorm 的平移项是否保留属于独立设计。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
