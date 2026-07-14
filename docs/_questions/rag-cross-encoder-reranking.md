---
title: "为什么 RAG 常用 Cross-Encoder 做重排？"
source: "公开真实面试题整理；答案依据原论文原创整理"
review_status: "待复习"
category: "RAG"
difficulty: "中等"
tags:
  - Reranker
  - Cross-Encoder
  - 两阶段检索
published: true
verified: true
date: 2026-07-13
---

## 核心回答

第一阶段检索器的目标是低成本地从全库取得高召回候选；Cross-Encoder 把 Query 与候选文档联合输入模型，能进行更细粒度的 token 交互，因此通常比独立编码的双塔相似度更适合精排。代价是每个 Query-Document 对都要执行模型计算，所以只对 Top-N 候选重排，再选较小的 Top-K 送给生成器。

## 展开说明

典型两阶段流程是：

1. BM25、Dense 或 Hybrid 从全库召回 Top-N。
2. 对 N 个 Query-Document 对进行 Cross-Encoder 打分。
3. 依据重排分数选择 Top-K，并完成去重、邻接片段合并和 token 预算控制。

双塔模型可预先计算文档向量，适合大规模近邻搜索；Cross-Encoder 不能这样复用文档表示，但可以直接建模否定词、实体关系和查询条件。Reranker 只能重新排列已有候选，无法找回第一阶段没有召回的文档，因此必须同时观察候选 Recall@N 和重排后的 nDCG@K、MRR。

LLM Rerank 还能处理复杂指令，但成本、延迟、顺序偏差和输出稳定性需要单独评估，不能仅凭模型更大就假设更准确。

## 工程实践

根据 SLO 扫描 N、K、模型大小和 Batch Size，测量质量增益与 p95 延迟。训练或选择 Reranker 时要加入难负例，并确保 Query 与文档截断没有删除关键条件。上线后保存粗排名次和精排分数，区分“没召回”和“排错了”。

## 常见追问

1. Bi-Encoder 与 Cross-Encoder 的计算方式有什么差别？
2. Top-N 太小或太大分别会发生什么？
3. 为什么 Reranker 不能修复所有召回问题？

## 一句话复习

> 粗排负责从全库高召回，Cross-Encoder 负责在有限候选中高精度排序，两者解决不同问题。

## 参考资料

- 面经主题：[公开 Agent 面经中的 Reranker 问题](https://www.nowcoder.com/discuss/863430474180333568)
- 技术依据：[Passage Re-ranking with BERT](https://arxiv.org/abs/1901.04085)、[BEIR](https://arxiv.org/abs/2104.08663)
