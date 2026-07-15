---
title: "Embedding 模型升级时，如何重建索引、双写并无损切换？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "RAG"
difficulty: "中等"
tags:
  - Embedding
  - 索引迁移
  - 双写
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

先给出不能原地混写的原因：新旧 Embedding 通常不在同一向量空间。迁移主线说成蓝绿索引就够清楚——冻结快照、回填 V2、增量双写、校验、影子双读、小流量切换、保留回滚。

面试官往往会追问回填期间的数据一致性。补充变更日志或水位线、幂等写入、文档版本，以及切换时原子更新索引别名即可。

**可以这样答：**

> Embedding 模型升级后，新旧向量空间通常不可直接比较，因此不能在原索引中混写。稳妥做法是建立 V2 蓝绿索引：基于一致快照全量回填，同时把后续变更双写；校验数量、版本和召回质量后做影子双读，再逐步切流。切换通过索引别名原子完成，并保留 V1 以便回滚；迁移期间还要用水位线保证没有漏掉增量数据。

## 核心回答

Embedding 模型升级改变的是整个向量空间。即使新旧模型输出维度相同，向量方向、尺度、归一化方式和相似度分布也可能不同，因此文档向量与查询向量必须使用同一模型版本和预处理配置。稳妥方案是把模型、Tokenizer、Pooling、归一化、距离度量、Chunk 配置和索引参数组成不可变版本，创建独立 V2 Collection 或新 Named Vector，禁止新旧向量静默混用。

迁移流程可以概括为：从权威文档库冻结一个快照；用稳定 `document_id/chunk_id` 全量生成 V2 向量；从快照位点持续消费 CDC 或 Outbox，对新增、修改和删除同时更新 V1、V2；完成数量、版本和内容哈希校验后，用影子流量双读并比较检索与端到端答案；通过门禁后原子切换 Collection Alias；观察期内保留 V1，异常时只需切回别名。

## 展开说明

双写不能只处理新增文档。修改必须带单调版本或源数据 Offset，删除必须传播 Tombstone，重试要以文档版本和索引版本作为幂等键，避免旧事件覆盖新向量。若升级同时改变 Chunking，需为 Chunk 建新版本 ID，并以源文档为真相重新生成，不能按旧向量反推内容。

验证分三层：完整性检查记录数、缺失 ID、重复 ID、删除残留和版本分布；检索层用冻结查询集比较 Recall@K、MRR/nDCG、过滤正确性和 ANN 延迟；应用层比较答案正确性、引用可验证率、拒答率与成本。所谓“无损切换”首先指更新不丢、服务不中断且可回滚，质量是否无退化仍必须由评测证明。

## 工程实践

采用 `knowledge_v1`、`knowledge_v2` 两个物理索引，让线上只访问稳定别名 `knowledge_prod`。回填任务记录快照 Offset 和分片检查点；实时事件同时携带源内容哈希、文档版本和删除状态。切换前要求 V2 覆盖率达到 100%、双写积压归零、抽样向量维度与范数正常，并让一部分线上查询双读但只返回 V1。切换后继续观测空召回率、Recall、答案胜率、P95、索引成本和回滚 RTO，再按保留策略删除 V1。

## 常见追问

1. **新旧 Embedding 维度相同，为什么仍不能放在一起检索？** 维度相同不代表坐标系和相似度分布相同；查询向量与旧文档向量的距离没有经过共同训练保证，排序可能失真。
2. **全量回填期间发生的文档更新怎样保证不丢？** 在快照位点之后持续消费可重放的 CDC/Outbox，并用单调版本幂等写入；回填完成后等增量积压归零再验收。
3. **什么时候可以删除旧索引？** 原子切换后经过覆盖高峰和主要业务切片的稳定观察期，确认质量、延迟与更新链路无回退，并完成一次切回演练后再删除。
4. **双写失败时应该阻塞主业务吗？** 取决于新鲜度 SLO；通常权威数据先成功提交，索引更新进入可重放队列并告警，切换前必须把 V2 积压清零。

## 一句话复习

> Embedding 升级要把 V2 当独立向量空间，通过“快照回填 + CDC 双写 + 双读评测 + Alias 原子切换”实现可回滚迁移。

## 参考资料

- 面经主题：[公开 LLM 面试题主题汇总](https://github.com/llmgenai/LLMInterviewQuestions)
- 官方文档：[Qdrant — Migrate to a New Embedding Model](https://qdrant.tech/documentation/faq/qdrant-fundamentals/#can-i-switch-to-a-different-embedding-model-without-recreating-my-collection)
- 官方文档：[Qdrant Collection Aliases and Atomic Switch](https://qdrant.tech/documentation/manage-data/collections/#collection-aliases)
- 官方文档：[Milvus Manage Aliases](https://milvus.io/docs/manage-aliases.md)
- 原始论文：[MTEB: Massive Text Embedding Benchmark](https://arxiv.org/abs/2210.07316)
