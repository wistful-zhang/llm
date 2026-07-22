---
title: '固定 d_model 时调整 Attention Head 数，会改变哪些能力和成本？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '多头注意力'
  - 'Head Count'
  - '架构设计'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

指出总投影参数近似不变，但每头维度、并行模式和缓存组织会变。

**可以这样答：**

> 固定 d_model 时，标准 MHA 的 QKV 和输出投影参数量近似不随 Head 数改变，但每头维度会反向变化。更多 Head 能并行学习更多匹配模式，却可能让单头容量太小并增加切分、转置和调度开销。KV Cache 总元素量在标准 MHA 下大致不变，换成 GQA 后才主要由 KV Head 数决定。

## 常见追问

1. **Head 数必须整除 d_model 吗？** 常规实现需要整除，便于把投影结果重排成等宽的 Head。
2. **能否让不同 Head 维度不同？** 理论上可以，但张量布局和高效内核会复杂很多，所以主流实现使用等宽 Head。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
