---
title: '用 MinHash 和 LSH 做近重复去重时，阈值应该怎样调？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
tags:
  - 'MinHash'
  - 'LSH'
  - '近重复'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从 Shingle 粒度、Jaccard 目标、Band 参数和误删漏删样本审计回答。

**可以这样答：**

> 先把文档转成词或字符 Shingle，MinHash 近似它们的 Jaccard 相似度，LSH 用 Band 加速候选召回。阈值过低会把同主题但内容互补的文档误合并，过高又保留模板改写和轻微转载。应在多语言、长短文和代码样本上人工标注 Pair，联合调 Shingle、签名长度与 Band，并对候选做精确相似度复核。

## 常见追问

1. **短文为什么更难调？** Shingle 数少，一个短语重合就可能让 Jaccard 大幅波动。
2. **LSH 没召回的 Pair 会怎样？** 后续精排完全看不到，所以要先保证候选召回，再控制精确复核成本。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
