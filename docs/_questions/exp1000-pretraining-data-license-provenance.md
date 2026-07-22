---
title: '预训练数据的 License 和 Provenance 应记录到什么粒度？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '数据许可'
  - 'Provenance'
  - '治理'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明至少要能从训练 Shard 追溯到来源、抓取版本、许可判定和处理链。

**可以这样答：**

> 只记录一个语料集合名称不足以审计，至少要保存来源 URL 或数据集 ID、抓取时间、内容哈希、许可依据和处理版本。文档被切块、去重和混合后仍应能通过 Manifest 追溯到原始记录。这样才能响应删除、纠错和合规审计，也能在质量异常时定位具体来源，而不是重跑整个管线猜测。

## 常见追问

1. **保存 URL 会不会包含隐私？** 可能，Manifest 本身需要访问控制、最小化字段和合规保留周期。
2. **内容哈希能证明许可吗？** 不能，它只帮助标识内容，许可仍需来源条款和授权证据。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
