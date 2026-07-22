---
title: '标点符号应该独立成 Token，还是与相邻词合并？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Punctuation'
  - 'Tokenizer'
  - '边界'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明独立符号复用性高，常见词加标点合并可压缩但增加稀疏。

**可以这样答：**

> 独立标点 Token 能跨词复用，便于学习句法边界和开放组合。把常见的词加标点或空格加标点合并，可减少高频模式的 Token 数，却为大小写、语言和上下文制造更多变体。子词训练通常自动形成混合方案，评估时应特别检查中文标点、代码运算符和连续标点。

## 常见追问

1. **连续三个点应视为一个省略号吗？** 取决于原文字符和词表，三个句点与单个省略号是不同 Unicode 表示。
2. **标点切分会影响句子边界检测吗？** 会，但模型也能从组合 Token 学边界，外部工具不应假定每个标点都有独立 ID。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
