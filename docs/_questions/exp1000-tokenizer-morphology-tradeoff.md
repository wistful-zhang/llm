---
title: '形态丰富语言的 Tokenizer 为什么既不能只按词，也不能过度切碎？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'Morphology'
  - '多语言'
  - 'Tokenizer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

用词根与词缀共享解释子词价值，再说边界不一定等于语言学形态。

**可以这样答：**

> 形态丰富语言能从一个词根产生大量词形，整词词表会迅速膨胀且长尾严重。子词切分可共享词根和词缀，提高未见词泛化；切得过碎又会拉长序列并增加组合难度。统计子词未必对应真实语素，因此应同时看语言学覆盖、Fertility 和下游任务，而不是期待算法自动得到完美形态分析。

## 常见追问

1. **加入人工语素规则一定更好吗？** 可能改善特定语言，但增加维护和跨语言不一致，需要与统计方法对比。
2. **Byte Fallback 能解决形态问题吗？** 只能保证可表示，不能提供高效、有语义的词根词缀分解。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
