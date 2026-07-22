---
title: 'Parent-child Retrieval 为什么常用小块召回、大块生成？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'RAG'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Parent-child'
  - 'Chunking'
  - '上下文'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

解释小块匹配精确、大块语境完整，并说明父块去重和预算控制。

**可以这样答：**

> 小 Chunk 主题集中，向量或关键词匹配通常更精确；但直接拿小块回答容易缺少条件和上下文。Parent-child 做法用子块建立索引，命中后取回对应父段落或章节用于生成。多个子块可能指向同一父块，因此要合并去重，并按父块相关证据数量重新排序。父块不能无限大，仍要受 Token 预算和权限边界限制。

## 常见追问

1. **父块多大合适？** 以能完整表达一个主题且能放入生成预算为准，需要通过答案完整性实验调整。
2. **父块会不会引入无关内容？** 会，所以可在父块内高亮命中句，或再做局部压缩后送给模型。

## 延伸阅读

- [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)
