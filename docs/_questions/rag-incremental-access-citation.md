---
title: "如何让 RAG 支持增量更新、权限过滤和引用溯源？"
source: "公开面经高频主题；答案依据论文和官方文档原创整理"
verified: true
review_status: "待复习"
category: "RAG"
difficulty: "中等"
tags:
  - 增量索引
  - 权限过滤
  - 引用溯源
published: true
date: 2026-07-13
---

## 核心回答

为每个文档和 Chunk 保存稳定 ID、内容哈希、版本、更新时间、来源地址和权限元数据。数据变化时按 ID 做 Upsert；删除时先让 Tombstone 在查询侧立即生效，再异步物理清理旧 Chunk。查询必须先应用当前用户或用户组的权限过滤，再参与检索和重排；生成时让引用指向实际进入上下文的 Chunk，并用自动检查加人工抽检评估引用是否支持对应陈述。

## 展开说明

完整链路可以分成三部分：

1. **增量更新**：监听数据源变更，解析后比较内容哈希，只重建受影响的 Chunk。Tombstone 是查询过滤标记，不等于已经物理删除；后台仍要完成向量和原文清理。
2. **权限过滤**：在索引中保存 tenant、用户组或 ACL，检索阶段做安全裁剪（Security Trimming）。权限撤销时还要使相关缓存和可访问链接立即失效，不能只等待异步索引刷新。
3. **引用溯源**：上下文携带 document_id、chunk_id、版本和页码；回答中的引用由这些字段生成，并检查证据覆盖。自动 Entailment 或 LLM Verifier 仍是代理判断，不能保证引用绝对正确。

索引结构大改时可用新旧索引双写、离线校验后切换别名，避免直接重建导致长时间不可用。

## 工程实践

需要监控“数据源版本—索引版本—回答引用版本”是否一致，并保留变更审计。测试至少覆盖新增、修改、删除、权限撤销和旧链接失效；尤其要验证缓存不会绕过最新权限。

## 常见追问

1. 文档删除后怎样避免旧向量继续被召回？
2. 权限过滤应该放在向量检索前还是后？
3. 如何判断引用真的支持回答，而不是只有链接？

## 一句话复习

> 可维护的 RAG 要同时管理内容版本、检索权限和证据链，不能只维护向量。

## 参考资料

- 面试题主题：[AI Engineering Interview Questions 中的 RAG 更新、引用与访问控制题](https://github.com/amitshekhariitbhu/ai-engineering-interview-questions#retrieval-augmented-generation-rag)
- 官方资料：[Azure AI Search 增量更新](https://learn.microsoft.com/en-us/azure/search/search-howto-reindex)、[文档级访问控制](https://learn.microsoft.com/en-us/azure/search/search-document-level-access-overview)
