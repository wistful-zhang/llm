---
title: 'Adam 为什么需要 Bias Correction，训练后期还能不能省？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练与对齐'
difficulty: '中等'
tags:
  - 'Adam'
  - 'Bias Correction'
  - '优化器'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从 m、v 初始为零导致早期指数平均偏小推导 1-β^t 修正。

**可以这样答：**

> Adam 的 m 和 v 从零开始，训练早期只有少量观测，指数平均会系统性偏向零。分别除以 1-β₁^t 和 1-β₂^t 可恢复更合理的矩估计，尤其 β₂ 很接近 1 时影响持续更久。后期修正因子趋近 1，看似可忽略，但实现通常保留以保证恢复与学习率语义一致。

## 常见追问

1. **省掉修正等同于改学习率吗？** 早期近似是时间变化的有效学习率改变，且一阶、二阶修正不同，不能用单常数完全替代。
2. **断点恢复时 t 重要吗？** 重要，重置 Step 会重新应用早期修正并改变更新尺度。

## 延伸阅读

- [Hugging Face TRL 文档](https://huggingface.co/docs/trl/index)
