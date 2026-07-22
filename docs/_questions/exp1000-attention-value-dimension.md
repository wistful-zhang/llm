---
title: 'Attention 的 Value Dimension 可以与 Key Dimension 不同吗，代价是什么？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Attention'
  - 'Value Dimension'
  - '架构设计'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

区分 QK 相似度空间和 V 内容空间，说明输出投影负责对齐。

**可以这样答：**

> Q 与 K 必须在同一维度做点积，但 V 只被注意力权重加权求和，所以它可以采用不同维度。较小的 Value Dimension 能降低 V 投影、缓存和汇聚成本，却可能形成内容传递瓶颈。最终通过 W_O 映射回 d_model，因此选择应同时考虑质量、KV Cache 和高效内核支持。

## 常见追问

1. **缩小 K 但保留大 V 可行吗？** 可行，表示寻址空间被压缩而内容容量保留，但匹配精度可能下降。
2. **主流实现为什么常让两者相等？** 等维布局简单，便于融合 QKV 投影和复用优化内核。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
