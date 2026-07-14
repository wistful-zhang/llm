---
title: "LayerNorm 与 RMSNorm 有什么区别？"
source: "公开大模型高频面试题整理中的归一化对比题；答案依据两篇归一化原论文原创整理"
review_status: "待复习"
category: "LLM 基础"
difficulty: "中等"
tags:
  - LayerNorm
  - RMSNorm
  - 归一化
published: true
verified: true
date: 2026-07-13
---

## 核心回答

LayerNorm 对单个 token 的隐藏维度先减均值，再除以标准差，随后应用可学习的缩放和偏移；RMSNorm 不做减均值，只按均方根缩放，通常保留可学习的 scale。RMSNorm 省去了中心化计算，结构更简单，在许多现代 LLM 中能保持稳定训练，但这是一种经验取舍，不能据此断言它在所有模型和硬件上都更快或更好。

## 展开说明

若隐藏向量为 `x`，LayerNorm 规范化的是 `(x - mean(x)) / sqrt(var(x) + eps)`；RMSNorm 使用 `x / sqrt(mean(x²) + eps)`。前者同时去除平移和尺度变化，后者主要控制尺度。二者一般都沿 hidden dimension 计算，而不是像 BatchNorm 那样依赖同一 Batch 的其他样本，因此更适合变长序列和小 Batch。

“使用哪种 Norm”与“Norm 放在残差分支前还是后”是两个独立问题。RMSNorm 可以用于 Pre-Norm，LayerNorm 也可以用于 Pre-Norm；不能把 RMSNorm 与 Pre-Norm 当成同一个概念。

## 工程实践

混合精度训练时要关注归一化统计的计算精度、`eps` 和融合内核支持。切换 LayerNorm 与 RMSNorm 会改变模型函数，不能直接沿用旧权重并假设行为完全一致。比较时至少记录收敛曲线、梯度范数、吞吐以及目标任务质量。

## 常见追问

1. RMSNorm 去掉减均值后，为什么仍可能稳定训练？
2. LayerNorm 为什么不依赖 Batch 大小？
3. RMSNorm 与 Pre-Norm 分别描述哪个维度的设计？

## 一句话复习

> LayerNorm 同时中心化和缩放，RMSNorm 只控制均方根尺度；操作形式与它位于残差分支的前后位置无关。

## 参考资料

- 面试主题：[大模型常考面试题 100 道（第 1～25 道）](https://www.nowcoder.com/discuss/865888054261706752)
- 技术依据：[Layer Normalization](https://arxiv.org/abs/1607.06450)、[Root Mean Square Layer Normalization](https://arxiv.org/abs/1910.07467)
