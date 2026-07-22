---
title: 'FP16 训练的 Dynamic Loss Scaling 是怎样工作的？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'FP16'
  - 'Loss Scaling'
  - '混合精度'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

按放大 Loss、反传、检查 Inf、反缩放、更新 Scale 的顺序回答。

**可以这样答：**

> 训练先把 Loss 乘 Scale，使小梯度进入 FP16 可表示范围，再执行反向传播。更新前把梯度除回原尺度，并检查 Inf 或 NaN；若溢出则跳过该步并降低 Scale，连续稳定后再尝试增大。梯度裁剪必须在 Unscale 之后，否则阈值针对的是人为放大的梯度。

## 常见追问

1. **跳过一步会影响学习率调度吗？** 最好只在真正完成优化器更新时推进 Step 和调度，否则状态会错位。
2. **Scale 越大越好吗？** 不是，过大导致溢出频繁，过小又无法保护微小梯度。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
