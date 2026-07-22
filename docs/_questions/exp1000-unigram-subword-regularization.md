---
title: 'Subword Regularization 为什么在训练时随机采样切分？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '中等'
tags:
  - 'Subword Regularization'
  - 'Unigram'
  - '数据增强'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明同一文本多种合法切分可降低对单一 Token 边界的过拟合。

**可以这样答：**

> Unigram 等 Tokenizer 能为同一字符串提供多个概率切分，训练时采样不同方案相当于离散数据增强。模型被迫在多种子词边界下学习相同语义，对拼写变体和罕见词更稳健。采样过强会增加序列长度和训练噪声，推理通常仍使用确定性的最佳切分。

## 常见追问

1. **推理也随机切分能提升效果吗？** 可做集成但成本高且输出不稳定，常规部署使用确定性编码。
2. **它会改变标签对齐吗？** 语言模型标签随采样后的 Token 序列重建即可，字符级标注任务则需重新对齐。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
