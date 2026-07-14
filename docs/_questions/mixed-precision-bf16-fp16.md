---
title: "大模型训练中 FP16、BF16 和 FP32 应该如何配合？"
source: "大厂公开真实面试案例中的 BF16 与 FP16 对比题；答案依据混合精度论文与 Google Cloud 官方文档原创整理"
review_status: "待复习"
category: "训练与对齐"
difficulty: "中等"
tags:
  - Mixed Precision
  - BF16
  - FP16
published: true
verified: true
date: 2026-07-13
---

## 核心回答

FP16 和 BF16 都占 16 bit，但位宽分配不同：FP16 指数位较少、尾数位较多，精度更细但动态范围较窄；BF16 与 FP32 一样使用 8 位指数，动态范围更接近 FP32，但尾数更短。大模型训练常用 BF16 或 FP16 做矩阵计算和激活，同时让部分归一化、归约、优化器状态或主权重保留 FP32。FP16 更容易出现梯度下溢，通常需要 Loss Scaling；BF16 一般较少依赖缩放，但仍可能出现溢出或训练不稳定。

## 展开说明

混合精度不是把所有张量统一转成半精度。框架的自动混合精度会按算子选择 dtype，例如矩阵乘可使用 Tensor Core 友好的低精度，部分数值敏感操作则提升到 FP32。优化器若直接在低精度小更新上累加，更新可能被舍入掉，因此常保留 FP32 状态或主权重。

Loss Scaling 先放大损失，使反向梯度离开 FP16 的下溢区间，更新前再缩回；动态缩放器会在检测到 inf/NaN 时降低尺度。BF16 的动态范围更大，不代表有效精度等同 FP32，也不代表所有旧硬件都能高效支持。

## 工程实践

先根据 GPU/TPU 的原生支持选 dtype，再用完整训练曲线验证。监控 Loss Scale、inf/NaN、梯度范数、溢出跳步和吞吐；出现异常时检查学习率、归一化与自定义算子，而不是只切回 FP32。保存检查点时还要确认优化器状态的真实 dtype，不能仅按模型权重大小估算显存。

## 常见追问

1. BF16 与 FP16 都是 16 bit，为什么动态范围差很多？
2. Loss Scaling 解决梯度下溢时，为什么不会改变最终梯度？
3. 哪些张量通常值得保留 FP32？

## 一句话复习

> FP16 尾数更多但范围较窄，BF16 范围接近 FP32；混合精度用低精度提速、用高精度保护敏感状态。

## 参考资料

- 面试主题：[AgentGuide 大厂真实面经案例集](https://github.com/adongwanai/AgentGuide/blob/main/docs/04-interview/12-company-interview-cases.md)
- 技术依据：[Mixed Precision Training](https://arxiv.org/abs/1710.03740)、[Google Cloud BF16 说明](https://cloud.google.com/tpu/docs/bfloat16)
