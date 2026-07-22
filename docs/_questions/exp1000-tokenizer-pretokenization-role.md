---
title: 'Pre-Tokenization 在 BPE 之前做什么，规则选错会有什么后果？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Pre-Tokenization'
  - 'BPE'
  - 'Tokenizer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明它先确定可合并边界，后续 BPE 通常不能跨边界修复。

**可以这样答：**

> Pre-Tokenizer 先按空格、标点、数字或正则把原文切成初始片段，再在片段内部应用子词算法。它决定哪些字符永远不能被合并，因而深刻影响词表和序列长度。规则若偏向英文，中文、代码、URL 或带撇号文本会被异常切碎，而且后续增加 Merge 也未必能跨边界补救。

## 常见追问

1. **为什么前导空格常和单词绑定？** 它让模型区分词首与词中片段，并把空格信息保留在可逆 Token 中。
2. **能在模型训练后更改 Pre-Tokenizer 吗？** 不能无损更改，Token ID 序列会变化，原有 Embedding 语义随之错位。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
