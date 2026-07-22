---
title: 'SentencePiece 为什么把空格编码成可见的特殊符号？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '简单'
tags:
  - 'SentencePiece'
  - 'Whitespace'
  - 'Tokenizer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明把空格纳入普通符号序列可在不依赖语言分词器的情况下保持可逆。

**可以这样答：**

> SentencePiece 常把空格转成类似 ▁ 的元符号，让空格与其他字符一起参与子词训练。这样模型能区分词首和词中片段，也能从 Token 序列无损恢复原始空格。它直接在原始句子上训练，不要求先有英语式按词切分，因此对无空格语言和多语言数据更通用。

## 常见追问

1. **连续多个空格一定能保留吗？** 取决于 Normalizer 是否先折叠空白，必须检查具体模型配置。
2. **这个符号会真的出现在解码文本里吗？** 正常 Decoder 会把它还原为空格，只有直接查看 Token 字符串时才常见。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
