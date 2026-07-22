---
title: 'IVF 索引里的 nlist 和 nprobe 分别影响什么，怎么联合选择？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'RAG'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'IVF'
  - 'nprobe'
  - '向量索引'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

解释聚类桶数量和查询探测桶数，结合数据规模与延迟做实验。

**可以这样答：**

> nlist 决定向量空间被分成多少倒排簇，过少则单簇扫描大，过多则训练和路由误差增加。nprobe 决定一次查询访问多少簇，增大通常提高 Recall 但增加扫描量。应在代表性数据上训练聚类，用精确近邻作真值，联合测试不同组合的召回、延迟和内存。数据分布明显变化后要重新训练中心，不能只调 nprobe 掩盖索引老化。

## 常见追问

1. **有 Metadata Filter 时怎么测？** 使用真实过滤选择性测试，因为过滤后每个簇的有效候选数会明显变化。
2. **nprobe 等于 nlist 会怎样？** 接近扫描全部簇，召回趋近精确搜索，但失去 IVF 的主要速度优势。

## 延伸阅读

- [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)
