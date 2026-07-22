---
title: '中文 Tokenizer 应该偏向单字还是多字词，怎样权衡？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '中文'
  - 'Tokenizer'
  - '子词'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

比较单字的开放覆盖与多字词的压缩、语义完整性和稀有度。

**可以这样答：**

> 单字覆盖稳定、组合开放，遇到新词仍能表示，但序列更长且词义需要模型跨 Token 组合。常见多字词能提高压缩率并保留短语整体性，却占用词表，低频词块也可能训练不足。实际词表通常混合字符和高频多字片段，并用中文领域数据的 Token 长度与任务质量选择比例。

## 常见追问

1. **中文必须先做分词吗？** 不必须，SentencePiece 或 Byte-Level 方法可以直接从字符序列学习子词。
2. **成语适合做单 Token 吗？** 高频成语可能受益，但是否进入词表应由频率、语料覆盖和预算共同决定。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
