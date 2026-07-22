---
title: 'Token Fertility 是什么，为什么能反映 Tokenizer 对某种语言是否友好？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Token Fertility'
  - '多语言'
  - 'Tokenizer 评估'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

定义每个词或字符平均被切成多少 Token，并说明必须按语言口径比较。

**可以这样答：**

> Token Fertility 常指一个词平均对应多少 Token，也可按字符定义 Token 比率。数值高意味着文本被切得更碎，同样内容占用更多上下文和计算，模型也要跨更多步组合语义。跨语言比较时必须统一分词或字符口径，并结合语义质量，因为低 Fertility 不代表词表中的稀有大块已被充分训练。

## 常见追问

1. **为什么不能只看字符数除 Token 数？** 不同语言字符承载的信息量不同，单一字符口径可能产生误导。
2. **Fertility 高会影响生成延迟吗？** 会，同样内容需要生成更多 Token，Decode 步数和费用都增加。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
