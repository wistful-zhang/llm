---
title: "Xavier 与 He 初始化分别基于什么方差推导，应该如何选择？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "训练与对齐"
difficulty: "中等"
tags:
  - Xavier Initialization
  - He Initialization
  - 训练稳定性
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

从方差守恒推公式最自然。线性层希望输出尺度不随 fan_in 放大，权重方差约取 1/fan_in；Xavier 再兼顾前向与反向的 fan_in、fan_out。ReLU 会丢掉约一半激活，He 用约 2/fan_in 补偿。

回答选择时直接联系激活函数即可，但提醒推导依赖独立、零均值等近似。残差、归一化和门控结构会改变最合适的实际尺度，需要看训练初期统计。

**可以这样答：**

> Xavier 初始化希望前向激活和反向梯度的方差都较稳定，常用方差约 2/(fan_in+fan_out)，适合 tanh 等近似对称激活。ReLU 会把一部分信号置零，He 初始化用约 2/fan_in 的方差补偿，更适合 ReLU 系列。两条公式都建立在独立、零均值等近似上；遇到残差、归一化或门控结构时，它们只是合理起点，不是必须遵守的最优常数。

## 核心回答

设 `y_j=Σ_i W_{ji}x_i`，在权重与输入独立、零均值的近似下，`Var(y)≈fan_in·Var(W)·Var(x)`。保持前向方差需要 `Var(W)≈1/fan_in`；保持反向方差又与 `fan_out` 有关。Xavier/Glorot 用二者折中，常见 uniform 边界为 `±sqrt(6/(fan_in+fan_out))`。

ReLU 对对称零均值输入大约保留一半激活，二阶矩约减半，因此 He 初始化常取 `Var(W)=2/fan_in`，normal 标准差为 `sqrt(2/fan_in)`。leaky ReLU 的 gain 还会随负半轴斜率调整。

## 展开说明

初始化目标是避免信号和梯度随深度指数消失或爆炸，让训练从可优化区域开始。Xavier 最初针对饱和非线性讨论；He 针对 rectifier 网络推导。实际模型中 LayerNorm、残差连接、SwiGLU、深度和并行精度都会改变尺度传播。

Transformer 常有自己的残差缩放或按层数调整的初始化，不能看到 ReLU 就机械使用 He。预训练模型微调时只初始化新加模块，并检查它是否破坏残差流。

## 工程实践

初始化后用一小批数据跑前向和反向，记录每层激活均值/RMS、零值或饱和比例、梯度 RMS，以及 update-to-weight ratio。若深层尺度持续放大，先核对 fan 定义、矩阵转置用法和 gain，再检查残差缩放。多随机种子比较早期 loss。

## 常见追问

1. **fan_in 与 fan_out 分别是什么？** fan_in 是每个输出接收的输入连接数，主导前向方差；fan_out 是每个输入影响的输出数，主导反向梯度方差。
2. **为什么 ReLU 的系数是 2？** 对对称输入，ReLU 约丢弃一半负值，使二阶矩减半，因此把权重方差加倍以补偿。
3. **有 LayerNorm 后还需要初始化吗？** 需要。归一化不能消除所有残差分支、梯度和数值精度问题，错误尺度仍可能造成 loss spike。
4. **Xavier 和 He 应该只看激活函数选择吗？** 不应。还要结合残差结构、归一化、门控、深度和权重矩阵的实际使用方向。

## 一句话复习

> Xavier 为前后向方差折中，He 为 ReLU 丢失一半能量做补偿；最终要用逐层尺度验证。

## 参考资料

- [Understanding the difficulty of training deep feedforward neural networks](https://proceedings.mlr.press/v9/glorot10a.html)
- [Delving Deep into Rectifiers](https://arxiv.org/abs/1502.01852)
