---
title: 'Tokenizer 在编码前统一 Lowercase 有什么收益和损失？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '简单'
study_tier: 'extended'
tags:
  - 'Lowercase'
  - 'Normalization'
  - 'Tokenizer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明减少词形碎片与丢失专名、缩写、代码信息的权衡。

**可以这样答：**

> 统一小写可把 Apple 和 apple 等变体共享词表与统计，降低稀疏性，适合部分检索或早期 Encoder。它会丢失专名、缩写和句法线索，对代码、化学式和精确生成尤其有害。通用生成式 LLM 通常保留大小写，让子词模型自行共享可复用片段。

## 常见追问

1. **保留原文同时增加小写特征可行吗？** 可以通过额外特征或数据增强实现，但标准 Decoder-Only 接口通常只输入 Token ID。
2. **大小写不敏感搜索为什么仍常小写？** 检索目标本身允许忽略大小写，规范化可提高召回，但展示仍应保留原文。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
