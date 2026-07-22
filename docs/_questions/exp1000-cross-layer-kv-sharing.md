---
title: 'Cross-Layer KV Sharing 怎样进一步减少 KV Cache，为什么可能掉点？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'KV Cache'
  - '跨层共享'
  - '推理效率'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明多个层复用同一组或少数组 K、V，区分它与 GQA 的层内共享。

**可以这样答：**

> Cross-Layer KV Sharing 让多个 Attention 层复用某层或共享模块生成的 K、V，缓存不再按层完整增长。它与 GQA 的区别是 GQA 在同一层跨 Query Head 共享，前者在深度方向共享。不同层原本需要不同抽象级别的记忆，强共享会限制层间演化，因此常采用分组共享、补充投影或继续训练减少损失。

## 常见追问

1. **共享后 Q 还按层独立吗？** 通常是，层仍用自己的 Q 去查询共享或分组的 K、V。
2. **缓存能减少多少？** 理想上与共享层组大小近似成比例，但还要保留每层其他状态和元数据。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
