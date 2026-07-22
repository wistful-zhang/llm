---
title: 'Adafactor 怎样用 Factored State 降低优化器显存？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练与对齐'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Adafactor'
  - '优化器状态'
  - '显存'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明矩阵二阶矩用行均值和列均值近似重建，而非保存完整同形张量。

**可以这样答：**

> 对二维权重，Adafactor 不保存完整 v，而保存行方向和列方向的统计，再用外积形式近似每个元素的二阶矩。状态从 O(mn) 降到 O(m+n)，对大矩阵节省显著。近似会丢失元素级相关结构，算法还常配相对步长和更新裁剪，所以复现时要说明具体变体。

## 常见追问

1. **向量参数怎样 Factor？** 无法做行列分解，通常仍保存完整一维二阶状态。
2. **它会减少梯度显存吗？** 不会直接减少梯度，只压缩优化器统计状态。

## 延伸阅读

- [Hugging Face TRL 文档](https://huggingface.co/docs/trl/index)
