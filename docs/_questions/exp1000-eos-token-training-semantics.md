---
title: 'EOS Token 在预训练中学到什么，漏加 EOS 会有什么后果？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'EOS'
  - '文档边界'
  - '生成停止'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把文档终止概率、样本边界和推理停止行为联系起来。

**可以这样答：**

> EOS 是模型可预测的序列终止事件，让它学习一段文本在何处自然结束。多文档拼接时 EOS 还标记边界，防止模型把无关文档当作连续语义。训练漏加或部署使用错 ID 会让模型不愿停止、跨样本续写，或只能依赖 max_tokens 强制截断。

## 常见追问

1. **每个训练 Chunk 末尾都该加 EOS 吗？** 只有真实文档结束才应代表语义终止，任意截断点加 EOS 可能教会模型过早结束。
2. **EOS 和 Stop String 一样吗？** 不一样，EOS 是模型词表事件，Stop String 常由服务在解码文本匹配后外部截停。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
