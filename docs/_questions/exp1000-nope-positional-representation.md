---
title: '完全不使用显式位置编码的 NoPE Transformer 为什么仍可能学到顺序？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'NoPE'
  - '位置编码'
  - 'Causal Mask'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明因果可见集合本身包含位置信息，同时指出长度泛化并非自动解决。

**可以这样答：**

> 在因果模型中，不同位置能看到的前缀长度不同，Causal Mask 本身就提供了隐式顺序线索。多层注意力还可以通过累积和边界 Token 推断相对位置，因此 NoPE 并非完全没有位置信息。它可能表现出一定长度泛化，但精确计数、远距离定位和训练稳定性仍可能弱于显式位置方案。

## 常见追问

1. **双向 Encoder 能同样依赖 Mask 学顺序吗？** 更困难，因为各位置可见集合相同，没有因果边界提供的天然不对称。
2. **NoPE 是否完全不增加位置相关偏置？** 严格 NoPE 不加，但实际模型可能通过局部窗口或特殊 Token 引入其他结构先验。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
