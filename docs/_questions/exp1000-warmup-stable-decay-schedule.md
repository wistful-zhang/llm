---
title: 'Warmup-Stable-Decay 调度相比全程 Cosine 有什么工程优势？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练与对齐'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'WSD'
  - '学习率调度'
  - '持续训练'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明长平台期不依赖预知终点，需要收尾时再启动 Decay。

**可以这样答：**

> WSD 在 Warmup 后保持较长稳定学习率，只有决定结束训练时才进入 Decay。它允许中途追加 Token 或比较不同训练长度，而不用因 Cosine 进度不同让每个 Checkpoint 经历不同学习率历史。平台期过长或 LR 过高会浪费后期收敛机会，Decay 长度仍需按目标质量和预算安排。

## 常见追问

1. **Stable 阶段完全不变吗？** 典型定义近似常数，也可叠加小幅变化，关键是与未知终点解耦。
2. **比较不同 Token Budget 时为何更公平？** 较短和较长 Run 在共同前缀上经历相同 LR，而不是一开始就按不同终点衰减。

## 延伸阅读

- [Hugging Face TRL 文档](https://huggingface.co/docs/trl/index)
