---
title: '大规模预训练为什么需要 Content-Addressed Manifest？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
tags:
  - 'Data Lineage'
  - 'Content Hash'
  - 'Manifest'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明用内容哈希固定数据身份，使复现、缓存和审计不依赖可变路径。

**可以这样答：**

> 路径和 URL 可以指向后来变化的内容，单靠文件名无法证明两次训练使用同一数据。Content-Addressed Manifest 为每个 Shard 或记录保存内容哈希、大小、处理版本和来源，使缓存校验、断点恢复与审计有稳定身份。哈希不能替代权限和隐私治理，但能及时发现静默覆盖、传输损坏和配置漂移。

## 常见追问

1. **应该哈希原始数据还是处理后数据？** 两者都值得记录，才能追溯原始来源并复现最终训练字节。
2. **哈希算法选择重要吗？** 应使用抗碰撞、跨平台一致的算法，并明确规范化与序列化方式。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
