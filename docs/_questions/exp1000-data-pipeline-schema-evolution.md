---
title: '预训练数据 Schema 升级时，怎样避免新旧 Shard 被错误混读？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Schema Evolution'
  - '数据管线'
  - '版本控制'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明显式版本、严格解析、迁移工具和 Manifest 中的处理版本。

**可以这样答：**

> 每个 Shard 和 Manifest 都应带显式 Schema Version，Reader 对未知未来版本要失败而不是猜默认值。字段新增需定义向后兼容默认，语义变化则应做离线迁移并生成新内容哈希。混合训练前要统计各版本比例和关键字段缺失，防止某些 Worker 使用旧代码静默丢掉质量权重或边界信息。

## 常见追问

1. **JSON 多余字段忽略不是更兼容吗？** 对非关键字段可以，但训练语义字段被忽略会造成静默分布差异，应按白名单处理。
2. **为什么迁移后要新哈希？** 处理后字节和语义已变化，沿用旧身份会破坏复现与缓存校验。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
