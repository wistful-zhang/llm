---
title: '预训练数据管线怎样处理损坏压缩包、截断记录和解码失败？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '数据管线'
  - '损坏数据'
  - '容错'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

强调可观测地跳过、隔离原始 Shard 和阈值告警，不能静默吞错。

**可以这样答：**

> 单条记录解码失败可隔离并继续，但必须记录 Shard、偏移、错误类型和计数，避免静默丢掉某一语言或来源。压缩包校验失败或错误率超过阈值时应停用整个 Shard，保留原始文件供复核。训练各 Rank 对坏样本的处理还要一致，否则步数和 Collective 可能失配。

## 常见追问

1. **用空样本替代坏记录可以吗？** 会浪费算力并改变 Loss 归一化，通常应确定性跳过并补取有效样本。
2. **为什么要设来源级告警？** 大量同类错误可能说明上游格式升级或数据投毒，不能当作零散坏点。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
