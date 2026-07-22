---
title: 'GQA 的 KV Head 数应该怎样选，为什么不是越少越好？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'GQA'
  - 'KV Head'
  - '推理效率'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把 KV Cache 和带宽收益与多个 Query 共享同一 K、V 的质量损失对应起来。

**可以这样答：**

> 减少 KV Head 会按比例降低 KV Cache 容量和解码时读取带宽，是 GQA 的主要收益。KV Head 太少时，过多 Query Head 被迫共享同一组 K、V，注意力模式的多样性可能下降。实践会在目标上下文长度、并发、模型质量和张量并行切分约束之间选择可整除的组数。

## 常见追问

1. **KV Head 数为 1 是什么结构？** 这就是 MQA，所有 Query Head 共享一组 K、V。
2. **从 MHA 改成 GQA 能直接复用权重吗？** 通常需要合并或平均 KV Head 并继续训练，直接改形状会丢失已有结构。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
