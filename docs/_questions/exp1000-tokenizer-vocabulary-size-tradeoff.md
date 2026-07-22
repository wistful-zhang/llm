---
title: 'Tokenizer 词表过大或过小分别会带来什么问题？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'Tokenizer'
  - 'Vocabulary'
  - 'Embedding'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

同时比较序列长度、词表矩阵、稀有 Token 训练频次和多语言覆盖。

**可以这样答：**

> 词表太小会把文本切得更碎，序列变长，Attention 与训练 Token 成本增加。词表太大则扩大 Embedding 和 LM Head，许多稀有 Token 得不到充分训练，Softmax 计算也更重。合适大小要结合语言分布、模型宽度、上下文预算和部署成本，用压缩率与下游质量共同选择。

## 常见追问

1. **大词表一定让中文更省 Token 吗？** 通常有机会，但若训练语料分配不合理，词表容量可能被其他语言或噪声片段占用。
2. **共享 LM Head 时大词表参数成本如何算？** 输入输出只存一份词表矩阵，但输出 Softmax 和通信仍随词表大小增长。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
