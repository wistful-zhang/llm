---
title: "Gradient Noise Scale 与 Critical Batch Size 是什么？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "训练与对齐"
difficulty: "困难"
tags:
  - Gradient Noise Scale
  - Batch Size
  - 分布式训练
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论：** Gradient Noise Scale 衡量随机梯度噪声相对真实梯度的大小，Critical Batch 是继续增大 batch 开始收益递减的尺度。
2. **再讲关键机制：** 解释小 batch 方差随 batch 增大下降，以及并行加速从近线性转为样本效率下降。
3. **主动说取舍：** 大 batch 提升硬件吞吐，却减少单位 token 的更新次数，常需学习率调整且估计本身有噪声。
4. **最后落到项目：** 做 batch sweep，报告 steps-to-target、tokens-to-target、吞吐和 Noise Scale 趋势；讲完停。

**60 秒口述示例：**

> 我会先给直觉：不同 mini-batch 梯度差异越大，Gradient Noise Scale 越高，也就能从更大 batch 的方差降低中获益。接近 Critical Batch 后再加 batch，墙钟可能更快，但达到同一 loss 需要更多样本，统计效率开始恶化。项目里我会做 batch sweep，同时画每秒 token、达到目标 loss 的 step 与 token 数，并跟踪 Noise Scale，而不是只看 GPU 利用率。 目标是墙钟和样本效率共同最优。


## 核心回答

单样本或小 Batch 梯度可看作真实平均梯度 `G` 加噪声。若梯度协方差为 `Σ`，一种常见的简单 Gradient Noise Scale 近似是 `B_noise≈tr(Σ)/||G||²`：信号越小、样本间方差越大，需要越大的 Batch 才能平均掉噪声。Critical Batch Size 与这个量同阶，表示继续增大 Batch 开始出现明显边际递减的区域，而不是一条对所有训练阶段固定的硬阈值。

在临界值以下，增大 Batch 往往能减少达到目标 loss 所需的优化步数并提高并行度；超过后，每步梯度已经较稳定，继续加样本主要增加计算，步数不再近似同比下降。于是硬件吞吐可能继续上升，训练的样本效率却下降。

## 展开说明

可用多个独立 Microbatch 的梯度估计均值与方差，比较小 Batch 和大 Batch 梯度范数来降低直接保存协方差的成本。Noise Scale 会随训练阶段、数据 Domain、参数子空间和预条件器变化；早期与后期的合理 Global Batch 可能不同。

所谓 Linear Learning-rate Scaling 是在一定范围内让学习率随 Batch 增大，并配合 Warmup 保持每处理相近样本数的更新尺度，但它不是 Noise Scale 理论保证的万能规则。Batch 太大还会减少固定 token 预算下的参数更新次数，并改变 Adam 状态与正则化行为。Gradient Accumulation 与数据并行在数学上可形成同一 Global Batch，但 BatchNorm、随机性和每 Microbatch 的裁剪会破坏严格等价；LLM 通常没有 BatchNorm，仍需检查 loss 归一化和裁剪时机。

## 工程实践

在几个训练阶段周期性估计 Noise Scale，并对候选 Global Batch 记录 tokens/s、达到同一验证 loss 的 token 数与墙钟时间。扩卡时区分通信带来的吞吐变化和优化带来的步数变化。若增大 Batch，应重新检查学习率、Warmup token、梯度裁剪及每次日志的 token 归一化，避免“系统更快”掩盖“多消耗数据”。

## 常见追问

1. **Critical Batch 是固定常数吗？** 不是。它会随模型参数、训练进度和数据分布变化，通常只能说处于某个数量级或区间。
2. **超过 Critical Batch 后加 GPU 完全没用吗？** 不是。端到端吞吐仍可能提高，但优化步数不再同比减少，需要用达到目标质量的墙钟时间判断收益。
3. **Gradient Accumulation 与更大的物理 Batch 完全等价吗？** 在相同样本、正确 loss 归一化且只在累积后更新和裁剪时近似等价；随机算子、逐 Microbatch 裁剪等会造成差异。

## 一句话复习

> Gradient Noise Scale 衡量梯度方差相对信号的大小，Critical Batch 标志“大 Batch 减少优化步数”的收益开始明显递减。

## 参考资料

- [An Empirical Model of Large-Batch Training](https://arxiv.org/abs/1812.06162)
- [Measuring the Effects of Data Parallelism on Neural Network Training](https://arxiv.org/abs/1811.03600)
