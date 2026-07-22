---
title: 'Factorized Embedding Parameterization 如何降低大词表参数量？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'Embedding'
  - '低秩分解'
  - '词表'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明先映射到较小词向量维度，再投影到隐藏维度，并补充低秩瓶颈代价。

**可以这样答：**

> 直接词表矩阵大小是 vocab_size×d_model，大词表和宽模型会让这部分非常昂贵。Factorized Embedding 先查较低维的词向量，再通过共享投影映射到 d_model，相当于对大矩阵做低秩分解。它节省参数和存储，但低维瓶颈过小会限制 Token 表示，权重共享策略也需相应调整。

## 常见追问

1. **它会减少每层 Transformer 参数吗？** 不会，主要减少输入和可能的输出词表矩阵。
2. **输出 LM Head 怎样处理？** 可以用反向投影再乘低维词表矩阵，也可以保留独立输出权重。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
