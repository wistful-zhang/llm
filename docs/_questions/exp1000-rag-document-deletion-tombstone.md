---
title: '源文档被删除后，怎样确保向量库、缓存和引用里都不再出现？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'RAG'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '删除'
  - 'Tombstone'
  - '缓存失效'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把删除看成跨组件工作流，说明 tombstone、版本和审计。

**可以这样答：**

> 删除事件要携带稳定文档 ID 和版本，并先写 tombstone，阻止旧的延迟更新重新把内容加入索引。随后删除所有子 Chunk、稀疏索引、向量、派生摘要和相关缓存，引用服务也要标记不可访问。操作应可重试且有完成状态，后台对源清单和索引清单做周期性对账。涉及合规删除时还要处理日志与备份保留策略，并保存不含原文的审计证明。

## 常见追问

1. **向量库删除成功就完成了吗？** 没有，搜索索引、答案缓存、派生文件和副本都可能继续暴露内容。
2. **为什么需要 tombstone？** 它记录删除版本，可拒绝乱序到达的旧更新，避免已删文档复活。

## 延伸阅读

- [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)
