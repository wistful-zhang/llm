---
title: '多个短文档 Pack 到一条序列后，Position ID 是否应该重置？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Sequence Packing'
  - 'Position ID'
  - '文档边界'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明重置能保持短样本位置分布，但必须配合 Block Mask 和内核支持。

**可以这样答：**

> 重置 Position ID 让每个短文档都从位置 0 开始，避免大量样本因打包顺序随机落在高位置。若只重置位置却仍允许跨文档 Attention，多个 Token 会共享位置并互相可见，语义容易混乱。正确实现通常同时使用 Block-Diagonal Mask；不重置也可训练，但要确保位置分布和推理场景匹配。

## 常见追问

1. **RoPE 重置后 KV 能放在同一张量吗？** 可以，张量布局和逻辑位置可分离，但 Attention Mask 必须隔开样本。
2. **不重置有什么潜在好处？** 模型会见到更广位置范围，但这些位置与文档内真实距离没有稳定关系。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
