---
title: 'Attention Logit Soft-Capping 是什么，为什么不用简单截断？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Attention'
  - 'Logit'
  - '数值稳定性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

给出 c·tanh(x/c) 的直观作用，并比较硬截断的梯度问题。

**可以这样答：**

> Soft-Capping 常用 c·tanh(x/c) 把极端 Attention Logit 平滑压到有限范围。它能防止 Softmax 过早饱和，降低训练中偶发大值造成的梯度和数值问题。硬截断在边界处不光滑且超出范围后梯度为零，平滑函数通常更利于优化。

## 常见追问

1. **c 设得太小会怎样？** 正常的相似度差异也会被压平，注意力选择能力和模型质量可能下降。
2. **LM Head 的 Logit 也能 Soft-Cap 吗？** 可以，但它直接改变输出分布和交叉熵梯度，需要独立评估校准与质量。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
