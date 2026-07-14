---
title: "如何系统地提升 RAG 的召回质量？"
source: "公开面经高频主题；答案依据论文原创整理"
verified: true
category: "RAG"
difficulty: "困难"
tags: [检索, Rerank, 评估]
review_status: 已掌握
published: true
date: 2026-07-11
---

## 核心回答

这是一道系统排查框架题。先建立可复现的评估集，把问题拆成“该召回的内容是否被找到”和“无关内容是否被过滤”。然后依次检查文档解析与切分、Query 改写、稀疏与稠密混合检索、元数据过滤，以及 Rerank。每次只改变一个环节，用 Recall@K、MRR、nDCG 和端到端答案正确率判断收益。

## 展开说明

可以按以下顺序排查：

1. **数据质量**：解析是否丢失表格、标题和层级关系，文档是否过期或重复。
2. **切分策略**：Chunk 是否包含完整语义，大小和重叠是否适合业务文本。
3. **Query 处理**：补全指代、拆解多跳问题、生成多个检索表达。
4. **召回策略**：组合 BM25 和向量检索，针对专有名词保留关键词能力。
5. **排序与过滤**：用元数据缩小范围，再用 Cross-Encoder 或 LLM Rerank。
6. **上下文组装**：去重、合并相邻片段，把最相关证据放在更有效的位置。

## 工程实践

不要一开始就更换 Embedding 模型。很多召回问题来自解析错误、Chunk 粒度不当或评估集缺失。先建立错误分类表，通常比盲目调参更快找到瓶颈。

## 常见追问

1. Chunk 越小，召回效果一定越好吗？
2. 混合检索的分数如何融合？
3. 如何构造没有人工标注的评估集？

## 一句话复习

> 优化 RAG 要先评估和归因，再按数据、Query、召回、重排的链路逐层改进。

## 参考资料

- 面经主题：[Datawhale 真实面试题中的 RAG 检索质量题](https://github.com/datawhalechina/hello-agents/blob/main/Extra-Chapter/Extra01-%E9%9D%A2%E8%AF%95%E9%97%AE%E9%A2%98%E6%80%BB%E7%BB%93.md)
- 技术依据：[Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)、[Passage Re-ranking with BERT](https://arxiv.org/abs/1901.04085)、[BEIR](https://arxiv.org/abs/2104.08663)、[Azure RRF 与混合检索](https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking)
