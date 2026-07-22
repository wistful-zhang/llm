---
title: '为什么使用不同 Tokenizer 的两个模型不能直接比较 Perplexity？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'Perplexity'
  - 'Tokenizer'
  - '评测'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 PPL 是每 Token 平均负对数似然的指数，而 Token 单位不同。

**可以这样答：**

> Perplexity 等于 exp(平均 Token NLL)，分母是该模型 Tokenizer 产生的 Token 数。一个词被切成一个还是三个 Token，会改变每步预测难度和平均方式，所以数值不在同一单位。跨 Tokenizer 比较可改用每字符或每 Byte 的负对数似然，并确保文本、边界和归一化完全一致。

## 常见追问

1. **同一 Tokenizer 就能直接比吗？** 还要统一数据、上下文切分、BOS/EOS 和 Loss Mask 才有意义。
2. **Bits Per Byte 怎么算？** 把总负对数似然换成以 2 为底并除以原始文本 Byte 数。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
