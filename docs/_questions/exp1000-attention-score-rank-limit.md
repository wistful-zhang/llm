---
title: '单个 Attention Head 的 QKᵀ 分数矩阵为什么存在秩上限？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'Attention'
  - '矩阵秩'
  - '表达能力'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

用 Q 和 K 的形状说明 rank(QKᵀ)≤d_head，再指出 Softmax 会改变线性秩分析。

**可以这样答：**

> 若 Q、K 形状为 n×d_head，那么乘积 QKᵀ 的线性秩最多是 d_head，无法表示任意 n×n 分数矩阵。增加 Head 或 d_head 能提供更多低秩匹配子空间。Softmax 是逐行非线性变换，之后的权重矩阵秩不再受同一个简单上限约束，但原始相似度仍由低维因子生成。

## 常见追问

1. **这是否意味着长序列必须让 d_head 随 n 增长？** 不意味着，语言注意力通常不需要任意矩阵，多层多头组合也能补充表达。
2. **加入位置 Bias 会怎样？** Bias 矩阵可增加 QKᵀ 之外的结构，使原始分数不再只受该低秩分解限制。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
