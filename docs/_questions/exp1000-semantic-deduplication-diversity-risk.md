---
title: 'Semantic Deduplication 为什么可能误删观点多样性？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '语义去重'
  - 'Embedding'
  - '数据多样性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明语义相近不等于信息重复，尤其在立场、事实细节和解题路径上。

**可以这样答：**

> Embedding 会把讨论同一主题的文档放得很近，但它们可能包含不同事实、观点或推导过程。用过低距离阈值保留单个代表，会把真实多样性当成冗余删除，并继承聚类中心选择的偏差。语义去重更适合候选发现，最终规则应结合字面重合、来源和结构，并按类别控制每簇保留数量。

## 常见追问

1. **为什么问答数据尤其危险？** 问题相似但答案可能针对不同条件，粗粒度 Embedding 容易把关键差异抹平。
2. **如何衡量误删？** 抽检被合并簇的信息增量，并比较去重前后的主题、来源和观点覆盖。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
