---
title: '多语言 Tokenizer 怎样避免高资源语言占满词表？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '多语言'
  - 'Vocabulary'
  - '数据采样'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明词表学习也要做语言重采样，并用 Fertility 和覆盖率复核。

**可以这样答：**

> 若直接按原始语料频率训练词表，英语等高资源语言会贡献大量 Merge，低资源语言只能退回字符或 Byte。可以对各语言做温度重采样、设置最低样本配额，或为关键脚本保留基础字符。完成后要按语言检查 Fertility、UNK 或 Byte Fallback 比例和下游质量，避免平均指标掩盖长尾退化。

## 常见追问

1. **给每种语言独立词表更好吗？** 能提高单语效率，但失去跨语言共享，模型输入协议和混合文本处理也更复杂。
2. **共享数字和标点有价值吗？** 有，它们跨语言复用频繁，可节省词表并帮助共享结构模式。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
