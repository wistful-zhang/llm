---
title: 'Lion 优化器与 AdamW 的更新信息有什么不同？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练与对齐'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Lion'
  - 'AdamW'
  - '优化器'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 Lion 主要保留一阶动量并取符号更新，突出状态显存和调参差异。

**可以这样答：**

> Lion 使用梯度与一阶动量的组合决定更新符号，不维护 Adam 那样的二阶矩状态。它减少一份优化器状态显存，更新方向更像每坐标固定幅度的 Sign Step。因为有效步长和 Weight Decay 语义与 AdamW 不同，通常需要更小学习率和重新调参，不能直接替换后比较。

## 常见追问

1. **Lion 为什么仍需要动量？** 动量平滑瞬时梯度并稳定符号方向，减少噪声造成的来回翻转。
2. **少二阶矩一定更省总显存吗？** 会省优化器状态，但参数、梯度和激活不变，总比例取决于并行与精度方案。

## 延伸阅读

- [Hugging Face TRL 文档](https://huggingface.co/docs/trl/index)
