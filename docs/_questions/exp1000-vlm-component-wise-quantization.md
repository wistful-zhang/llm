---
title: '量化 VLM 时，Vision Encoder、Projector 和 LLM 能否使用同一精度策略？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '多模态'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'VLM 量化'
  - '混合精度'
  - '部署'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明各模块激活分布和敏感度不同，应分模块校准与评测。

**可以这样答：**

> 三个模块的算子、激活分布和误差传播不同，统一量化位宽通常不是最优。LLM 权重可先尝试成熟的低比特方案，Vision Encoder 对小目标与 OCR 可能更敏感，Projector 虽小却直接决定模态对齐。应使用真实图片和文本联合校准，逐模块量化并做消融，必要时保留敏感层为 BF16 或 FP16。评估同时覆盖语言任务和视觉任务，避免只看整体平均分。

## 常见追问

1. **Projector 参数少就可以高精度保留吗？** 通常成本不大且值得尝试，但仍应通过性能分析确认它不是吞吐瓶颈。
2. **只用文本校准 LLM 部分可以吗？** 不够，多模态上下文会改变激活分布，应包含真实视觉 Token。

## 延伸阅读

- [CLIP](https://arxiv.org/abs/2103.00020)
