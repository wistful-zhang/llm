---
title: 'Residual Stream 中少数 Outlier Dimension 为什么会影响量化和训练？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Outlier Dimension'
  - 'Residual Stream'
  - '量化'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明少数通道幅度远高于其余通道，统一量化尺度会浪费分辨率。

**可以这样答：**

> 某些隐藏通道在大量 Token 上具有异常大的幅度，可能承担全局控制或由优化动态形成。按整张量使用统一低比特尺度时，这些 Outlier 决定量化范围，使普通通道只能使用很少的有效刻度。训练中它们也会放大特定投影和梯度，通常需通过逐通道量化、平滑变换或尺度监控处理。

## 常见追问

1. **直接裁剪 Outlier 可以吗？** 可以降低量化误差，但若通道承载关键功能会显著掉点，需要校准数据验证。
2. **Norm 为什么没有消除它们？** Norm 控制整体均方尺度，不保证每个通道在数据分布上都没有系统性大值。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
