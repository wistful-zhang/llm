---
title: 'MoE 的 Capacity Factor 控制什么，设置过大或过小会怎样？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'MoE'
  - 'Capacity Factor'
  - '路由'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

给出每个 Expert 可接收 Token 上限的直观定义，再说丢 Token 与内存浪费。

**可以这样答：**

> Capacity Factor 用平均 Token 数的倍数定义每个 Expert 本批次可接收的容量上限。过小会让热门 Expert 溢出，Token 被丢弃、改道或额外排队，从而损害质量或速度。过大能降低溢出，但会预留更多缓冲、增加 Padding 与通信不均，使实际利用率下降。

## 常见追问

1. **推理时还需要 Capacity Factor 吗？** 需要考虑容量和调度，但可用动态批处理或无丢弃实现，形式不一定与训练相同。
2. **平均容量怎么估算？** 常按批次 Token 数乘 top-k，再除以 Expert 数，最后乘 Capacity Factor。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
