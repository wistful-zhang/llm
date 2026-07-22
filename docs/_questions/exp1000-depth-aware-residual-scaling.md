---
title: '模型加深时为什么常按层数缩放残差分支或初始化方差？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '残差缩放'
  - '初始化'
  - '深层网络'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

用多层独立增量相加导致方差随深度增长来解释，不必死背某个固定系数。

**可以这样答：**

> 若每层都向残差流加入相近尺度的增量，累积方差会随层数增长，深层模型更容易出现激活或梯度不稳定。按 1/√L 一类尺度缩小分支或相应初始化，可以让总贡献保持在可控范围。具体系数取决于 Pre-Norm、分支数量和初始化方案，不能脱离架构机械套用。

## 常见追问

1. **为什么有时看到 1/√(2L)？** 每层含 Attention 和 FFN 两个残差分支，2L 反映了累计分支数量。
2. **残差缩放与 DeepNorm 是一回事吗？** 不是，DeepNorm 联合设计残差系数和初始化，目标相同但推导和使用条件更具体。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
