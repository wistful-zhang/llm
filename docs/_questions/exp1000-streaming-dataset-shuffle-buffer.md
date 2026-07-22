---
title: '流式预训练数据的 Shuffle Buffer 太小会造成什么问题？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '中等'
tags:
  - 'Streaming Dataset'
  - 'Shuffle Buffer'
  - '数据顺序'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明局部来源相关性、梯度偏置和多 Rank 重复，再讲内存折中。

**可以这样答：**

> 流式数据常按文件或来源有序到达，Buffer 太小时只能在局部范围打乱，连续 Batch 会高度同质。梯度噪声因此带有长相关性，模型可能短期过拟合某来源，不同 Rank 也更容易读到相邻重复片段。增大 Buffer、先打乱 Shard 并跨来源交织可改善，但要记录随机状态以支持确定性恢复。

## 常见追问

1. **Buffer 等于全数据大小才算真随机吗？** 理论上更接近全局 Shuffle，但大规模训练通常只能用分层近似。
2. **为什么先打乱文件仍不够？** 单个大文件内部可能同源且很长，仍会形成连续相关样本。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
