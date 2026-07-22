---
title: 'WordPiece 选择子词合并时，为什么不只看 Pair Frequency？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'WordPiece'
  - 'Tokenizer'
  - '子词'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明它更关注合并后对语言模型似然的改善，常用频率归一化近似。

**可以这样答：**

> WordPiece 的目标更接近选择能提升训练语料似然的子词，而不只是合并绝对频率最高的字符对。常见解释会用 pair_count 除以两个子项频率的乘积作为近似，使只因两个符号各自很常见而出现的 Pair 不一定优先。具体训练器实现可能不同，面试时应说明原则而不要把某个近似公式当成统一标准。

## 常见追问

1. **WordPiece Token 前的双井号表示什么？** 在常见实现中表示该子词只能作为词内续接片段，不代表原文真的有井号。
2. **WordPiece 一定需要空格分词吗？** 不一定，但经典实现常先做 Basic Tokenization，再在词内部切子词。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
