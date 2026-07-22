---
title: 'MoE 选择 Top-1 还是 Top-2 Expert，核心权衡是什么？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'MoE'
  - 'Top-k Routing'
  - 'Expert'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

对比单 Token 计算通信量与组合专家带来的鲁棒性和容量。

**可以这样答：**

> Top-1 每个 Token 只走一个 Expert，计算和 All-to-All 流量更低，部署更直接。Top-2 可以组合两个 Expert 的输出，在路由不确定或某个 Expert 过载时更有弹性，通常也提供更大激活容量。代价是专家计算近似翻倍，负载均衡与容量规划更复杂。

## 常见追问

1. **Top-2 的两个输出怎样合并？** 通常用 Router 概率归一化后加权求和。
2. **Top-k 能在训练和推理时不同吗？** 可以尝试，但会产生训练推理分布差异，必须专门校准和评测。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
