---
title: '原始 Transformer 为什么把 Token Embedding 乘以 √d_model？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Embedding'
  - '尺度'
  - 'Transformer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从 Embedding 初始化幅度与位置编码、残差分量的相对尺度解释。

**可以这样答：**

> 若 Embedding 每维按较小方差初始化，其向量分量可能比固定位置编码或后续残差分支偏小。乘以 √d_model 可以把 Token 表示整体尺度提升到更合适范围，使内容信号不会在相加时被淹没。现代 Pre-Norm 和不同初始化方案未必沿用该操作，因此它应与完整尺度设计一起理解。

## 常见追问

1. **乘法会改变向量方向吗？** 不会，只改变整体模长和与其他相加分量的相对尺度。
2. **使用 RoPE 后还必须这样做吗？** 不必须，RoPE 不与输入 Embedding 直接相加，许多现代模型采用不同初始化与 Norm。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
