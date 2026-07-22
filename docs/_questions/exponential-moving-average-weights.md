---
title: "训练中维护参数 EMA 有什么作用，它与 Polyak Averaging 有何区别？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "训练与对齐"
difficulty: "中等"
study_tier: "role"
tags:
  - EMA
  - 参数平均
  - 优化稳定性
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

先给 EMA 更新式和有效窗口直觉：

$$
\theta_{\mathrm{EMA}}\leftarrow\beta\theta_{\mathrm{EMA}}+(1-\beta)\theta
$$

$$\beta$$ 越大越平滑、也越滞后，有效窗口约为 $$1/(1-\beta)$$。再与一段区间内等权平均的 Polyak Averaging 区分。追问训练恢复时，记得 EMA 权重本身也要进入 Checkpoint。

**可以这样答：**

> 参数 EMA 每步按下式更新：
>
> $$
> \theta_{\mathrm{EMA}}\leftarrow\beta\theta_{\mathrm{EMA}}+(1-\beta)\theta_t
> $$
>
> 它提高近期参数权重并平滑噪声；有效窗口约为 $$1/(1-\beta)$$。Polyak Averaging 对选定区间等权平均。EMA 可让验证更稳定，但 $$\beta$$ 太大时会滞后；恢复训练时必须保存当前权重、EMA 权重和更新步数。

## 核心回答

EMA 更新为：

$$
\theta_t^{\mathrm{EMA}}=\beta\theta_{t-1}^{\mathrm{EMA}}+(1-\beta)\theta_t
$$

较早权重的系数按 $$\beta$$ 的幂指数衰减。$$\beta$$ 越接近 1，平均窗口越长、短期噪声越小，但对模型快速变化响应越慢。训练评估或发布时可以临时换入 EMA 参数，优化器仍继续更新原始参数。

Polyak/Ruppert Averaging 常对后期迭代做算术平均 $$\bar{\theta}_T=\frac{1}{T}\sum_t\theta_t$$，理论分析与 EMA 的非均匀权重不同。工程中“weight averaging”有时混用名称，面试时应先确认具体公式。

## 展开说明

EMA 可把随机梯度造成的局部抖动平滑掉，扩散模型和自监督方法也常用 EMA 参数作为评估模型或目标网络。它并不保证任何非凸问题都更优：训练早期跨越很大区域时，平均可能落在不佳位置，因此常 warm up、延后启用或使用随 step 变化的 decay。

初始化为零会产生早期偏差，可直接复制初始参数，或用 bias correction。若模型包含 BatchNorm running statistics，还要明确这些 buffer 是复制、平均还是重新校准。

## 工程实践

Checkpoint 必须明确保存 raw 权重、EMA 权重、当前 decay 和更新步数；恢复后不能把两者调换。FSDP/ZeRO 下维护完整 EMA 可能昂贵，可按 shard 更新。验证时用上下文管理器换入 EMA，再可靠恢复 raw 权重。上线前同时评估主指标、校准与长尾，而非默认 EMA 一定胜出。

## 常见追问

1. **β=0 会怎样？** EMA 完全等于当前参数，没有任何平滑；β 越接近 1，记忆窗口越长。
2. **EMA 参数参与反向传播吗？** 通常不参与。梯度更新 raw 参数，EMA 在 optimizer step 后以无梯度方式更新。
3. **EMA 与学习率平均是一回事吗？** 不是。EMA 平均的是参数轨迹，学习率调度改变每一步 raw 参数如何更新。
4. **为什么 EMA 会额外占显存或内存？** 它需要保存一份同形状参数；大模型常放 CPU、分片维护或只在训练后期启用。

## 一句话复习

> EMA 用指数权重平滑参数轨迹，降噪但会滞后；别把它与等权 Polyak 平均或优化器状态混为一谈。

## 参考资料

- [Averaged Stochastic Gradient Descent: Potentials and Opportunities](https://arxiv.org/abs/1104.3060)
- [TensorFlow：ExponentialMovingAverage](https://www.tensorflow.org/api_docs/python/tf/train/ExponentialMovingAverage)
