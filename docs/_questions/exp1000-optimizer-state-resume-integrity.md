---
title: '断点续训只恢复模型权重、不恢复 Optimizer State 会怎样？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Optimizer State'
  - '断点续训'
  - 'Checkpoint'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 Adam 的 m、v、Step 和调度器共同定义当前更新状态。

**可以这样答：**

> Adam 的一阶、二阶矩包含近期梯度历史，丢失后优化器会把已训练模型当作新起点，更新方向和尺度突然变化。Step 重置还会影响 Bias Correction、学习率调度和 Weight Decay 累积，常造成 Loss Spike。若只能从权重恢复，应降低学习率、重新 Warmup 并把它视为新的训练阶段，而不是声称精确续训。

## 常见追问

1. **只恢复二阶矩够吗？** 不够，一阶动量和 Step 也影响更新，缺任一项都不精确。
2. **换优化器继续训练怎么办？** 本来就无法复用同义状态，应设计过渡学习率并进行小规模稳定性验证。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
