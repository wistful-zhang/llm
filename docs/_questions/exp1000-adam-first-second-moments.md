---
title: 'Adam 的一阶矩和二阶矩分别在估计什么？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练与对齐'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Adam'
  - '优化器'
  - '动量'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

先写 m_t 和 v_t 的指数滑动平均含义，再解释更新量 m/√v 的自适应效果。

**可以这样答：**

> 一阶矩 m_t 是梯度的指数滑动平均，提供带方向的动量；二阶矩 v_t 是梯度平方的滑动平均，估计各参数近期尺度。更新用 m_t/(√v_t+ε)，让梯度长期偏大的维度步长被压小，稀疏或尺度小的维度相对放大。它是坐标级自适应，不等于精确使用 Hessian 曲率。

## 常见追问

1. **为什么二阶矩不是梯度方差？** Adam 通常记录 E[g²] 而没有减去 E[g]²，所以严格说是未中心化二阶矩。
2. **v 很小时有什么风险？** 分母过小会放大更新，因此需要 ε 并关注低精度下的数值范围。

## 延伸阅读

- [Hugging Face TRL 文档](https://huggingface.co/docs/trl/index)
