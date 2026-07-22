---
title: 'BF16 通常为什么不需要 Loss Scaling，它仍会不会下溢？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'BF16'
  - 'Loss Scaling'
  - '数值精度'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

比较 BF16 与 FP32 相同指数位、较少尾数位，并保留小值精度限制。

**可以这样答：**

> BF16 与 FP32 都有 8 位指数，动态范围接近，梯度不像 FP16 那样容易因指数范围不足下溢，所以通常不做 Loss Scaling。它只有 7 位尾数，舍入误差明显，极小增量加到大参数上仍可能消失。优化器状态和主权重常保留 FP32，并对归约使用高精度以弥补这一点。

## 常见追问

1. **BF16 就不会 Overflow 吗？** 仍可能，范围虽大但计算产生超大值或除零时一样会出现 Inf。
2. **给 BF16 加 Loss Scaling 有害吗？** 通常没有必要，过大还会增加溢出和实现复杂度。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
