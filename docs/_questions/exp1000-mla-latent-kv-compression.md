---
title: 'Multi-Head Latent Attention 如何压缩 KV Cache？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'MLA'
  - 'KV Cache'
  - '低秩压缩'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明缓存的是共享低维潜变量，而不是每个 Head 的完整 K、V。

**可以这样答：**

> MLA 先把隐藏状态投影到较低维的共享潜变量，再由该潜变量重建各 Head 所需的 K、V 表示。推理时缓存低维潜变量和必要的位置部分，而不保存所有 Head 的完整 K、V，因此显著降低缓存体积。收益依赖低秩瓶颈是否保留足够信息，以及实现能否避免重建开销抵消带宽优势。

## 常见追问

1. **MLA 与 GQA 的压缩思路相同吗？** 不同，GQA 直接共享 KV Head，MLA 用低维潜变量对多头 KV 做联合表示。
2. **为什么它尤其利于长上下文？** KV Cache 随序列长度线性增长，单 Token 缓存越小，长序列和高并发收益越明显。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
