---
title: '多语言模型为什么有时加入 Language Tag，它与 Tokenizer 本身的作用有何不同？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'Language Tag'
  - '多语言'
  - 'Special Token'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

区分“文本如何切分”和“显式告诉模型目标语言”两种功能。

**可以这样答：**

> 共享 Tokenizer 负责把各语言映射到统一离散词表，并不会总能明确表达期望输出语言。Language Tag 作为条件 Token 告诉模型输入或目标语言，尤其有助于翻译和相近语言消歧。它必须在训练中按一致位置使用，否则推理时临时添加只是陌生 Token，不能保证控制效果。

## 常见追问

1. **模型能自动识别语言还需要 Tag 吗？** 自由对话未必需要，但明确目标语言或低资源翻译时 Tag 能减少歧义。
2. **每种语言一个 Tag 会不会词表膨胀？** 相比普通词表矩阵只增加少量 Token，主要成本是数据和协议维护。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
