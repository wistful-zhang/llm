---
title: "向量检索中如何选择 Flat、HNSW、IVF 和 PQ？"
source: "公开 RAG 面试题整理；答案依据原论文和官方实现文档原创整理"
review_status: "待复习"
category: "RAG"
difficulty: "困难"
tags:
  - ANN
  - HNSW
  - Faiss
published: true
verified: true
date: 2026-07-13
---

## 核心回答

Flat 对全部向量做精确比较，适合作为小数据集方案和召回上限基线；HNSW 用分层近邻图换取较高召回和低查询延迟，但索引构建与内存开销较大；IVF 先把向量分到倒排单元，查询只探测部分单元，用 nprobe 在速度与召回间调节；PQ 把子向量量化以降低内存和距离计算成本，同时引入量化误差。选择依据是数据规模、内存、更新方式、目标召回和延迟，而不是固定偏爱某一种索引。

## 展开说明

- **Flat**：不近似、不压缩时结果精确，查询成本随向量数近似线性增长。
- **HNSW**：通过多层图从稀疏上层导航到稠密底层。M、efConstruction 和 efSearch 分别影响图连接、构建成本和查询搜索宽度。
- **IVF**：用粗量化器把向量划分到 nlist 个单元；nprobe 越大，通常召回越高、查询越慢。
- **PQ / IVFPQ**：将向量拆成多个子空间并存储码本编号，显著压缩内存，但近似距离会损失精度。

还要匹配距离度量。若模型按余弦相似度训练，常先归一化再用内积；不能在模型、索引和线上查询之间混用未核验的度量。删除、过滤、持久化和动态更新能力也取决于具体数据库实现，不能仅由算法名称推断。

## 工程实践

从真实库抽样，用 Flat 生成近邻真值，再比较 ANN Recall@K、p95 延迟、索引大小、构建时间和更新成本。分别扫描 efSearch、nprobe 等参数，并把元数据过滤后的召回纳入测试；高过滤率可能让原本良好的 ANN 参数失效。

## 常见追问

1. HNSW 的 M 和 efSearch 分别影响什么？
2. IVF 中 nlist 与 nprobe 如何取舍？
3. 为什么 PQ 能省内存但可能降低答案质量？

## 一句话复习

> 向量索引选择是在精确度、延迟、内存、构建和更新能力之间做有数据支撑的取舍。

## 参考资料

- 面经主题：[LLMInterviewQuestions 的 RAG 与向量数据库面试题](https://github.com/llmgenai/LLMInterviewQuestions)
- 技术依据：[HNSW 原论文](https://arxiv.org/abs/1603.09320)、[Faiss 索引官方说明](https://github.com/facebookresearch/faiss/wiki/Faiss-indexes)
