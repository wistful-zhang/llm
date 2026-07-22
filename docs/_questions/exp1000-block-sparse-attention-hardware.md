---
title: 'Block-Sparse Attention 为什么比任意稀疏模式更容易获得真实加速？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'Block Sparse'
  - 'Attention'
  - 'GPU'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从连续内存访问和矩阵块运算解释理论 FLOPs 与实际速度的差距。

**可以这样答：**

> GPU 擅长对规则、连续的矩阵块做高吞吐计算，Block-Sparse 可以跳过整块同时保留规整布局。任意元素级稀疏虽然理论计算更少，却需要大量索引、分支和不连续访存，常被调度开销吞掉。块大小需要兼顾模式灵活性和 Tensor Core 效率，过小会退化成低效碎片。

## 常见追问

1. **块越大越好吗？** 不是，大块计算高效但稀疏粒度粗，可能计算许多本可跳过的元素。
2. **Padding 会影响 Block-Sparse 吗？** 会，序列和窗口若不对齐块大小，边界块仍可能产生无效计算。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
