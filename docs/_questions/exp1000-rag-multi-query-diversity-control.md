---
title: 'Multi-query Retrieval 为什么可能提高召回，又为什么会引入噪声？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'RAG'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Multi-query'
  - '召回'
  - 'Query Rewrite'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

讲清多种表达覆盖不同检索面，同时说明去重、数量上限和意图一致性检查。

**可以这样答：**

> 同一问题的不同改写能覆盖同义词、实体别名和不同检索视角，因此可能找回单 Query 漏掉的文档。改写数量过多或偏离原意时，会扩大候选集并增加重排成本和假阳性。实践中限制为少量互补 Query，对关键实体和约束做一致性校验，再用融合算法合并并去重。是否值得启用要看 Recall 的增益能否抵消延迟和最终答案噪声。

## 常见追问

1. **生成的 Query 需要展示给用户吗？** 通常不必，但应记录用于调试；高风险搜索可展示关键改写供用户确认。
2. **多 Query 的结果简单取并集可以吗？** 可以作基线，但更常用带排名的融合和重排，避免某一路低质量结果占满上下文。

## 延伸阅读

- [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)
