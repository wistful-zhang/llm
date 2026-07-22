---
title: '通用 Embedding 在企业术语上召回很差，怎样判断是领域偏移而不是索引问题？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'RAG'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Embedding'
  - '领域偏移'
  - '诊断'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

先隔离向量生成、索引近似和数据切分三类变量，再谈微调。

**可以这样答：**

> 先用精确向量搜索排除 ANN 参数造成的漏召回，并检查文档解析和 Chunk 是否包含目标事实。再构建领域 Query 与相关文档对，比较通用语句和企业术语上的 Recall 差异。若同义业务术语在向量空间明显分离，而原文关键词检索有效，才更像领域表示不足。可先加词法通道和别名表，再用经过假负例审查的领域数据微调 Embedding，并重新评估跨域退化。

## 常见追问

1. **为什么不能直接换更大的 Embedding？** 更大不保证掌握私有术语，还会增加维度、存储和迁移成本。
2. **如何发现是假负例污染？** 抽检高相似但被标为不相关的文档，结合业务专家确认是否其实表达同一概念。

## 延伸阅读

- [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)
