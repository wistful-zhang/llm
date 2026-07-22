---
title: 'Reciprocal Rank Fusion 怎样融合多路检索结果，为什么不直接相加原始分数？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'RAG'
difficulty: '困难'
tags:
  - 'RRF'
  - '排序融合'
  - '混合检索'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

给出普通 Unicode 公式含义，说明它依赖名次而非不可比的分值。

**可以这样答：**

> RRF 给文档的融合分数通常写作 Σ 1/(k + rank_i)，rank_i 是文档在第 i 路结果中的名次。它不要求 BM25 分数和向量相似度处在同一尺度，因此对异构召回很实用。常数 k 控制头部名次优势，文档在多路都靠前会获得更高总分。RRF 简单稳健，但不会利用每一路置信度，仍需在业务集上调整候选深度并考虑后续重排。

## 常见追问

1. **某一路没有召回该文档怎么计算？** 该路不贡献分数，不需要人为赋一个极差的原始分值。
2. **k 越小有什么影响？** 越强调前几名的差异，可能提升精确匹配，也更容易受单路头部错误影响。

## 延伸阅读

- [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)
