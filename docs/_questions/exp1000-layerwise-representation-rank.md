---
title: '为什么要监控 Transformer 各层表示的有效秩？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - '有效秩'
  - '表示分析'
  - '模型诊断'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把奇异值谱、表示坍缩和任务集中度联系起来，同时提醒批次依赖。

**可以这样答：**

> 有效秩反映一批隐藏表示实际使用了多少独立方向，可用奇异值谱或参与率近似。秩突然下降可能意味着表示坍缩、过强正则或数值异常，层间变化也能显示特征逐渐集中。它高度依赖样本、Token 选择和归一化，不能脱离验证 Loss 与下游行为单独定性。

## 常见追问

1. **满秩就说明表示好吗？** 不是，噪声也能提高秩，关键是方向是否承载可泛化信号。
2. **RMSNorm 会改变有效秩吗？** 逐 Token 缩放通常不改变单样本方向，但跨样本谱和数值估计仍可能变化。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
