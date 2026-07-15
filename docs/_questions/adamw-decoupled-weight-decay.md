---
title: "AdamW 为什么要把 Weight Decay 与梯度更新解耦？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "训练与对齐"
difficulty: "中等"
tags:
  - AdamW
  - Weight Decay
  - 优化器
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

不要把 AdamW 说成“Adam 加了 L2”。最好写出参数先统一收缩、再做自适应梯度更新的式子，并对比 L2 项进入 Adam 一、二阶矩后的逐坐标缩放。面试官常追问 bias 和 Norm 为什么不衰减，这里应说明它是常见经验配置，需要消融验证，不是数学定律。

**可以这样答：**

> AdamW 的关键是把权重衰减移出 Adam 的梯度矩估计。若把 L2 项直接加进梯度，它会同时进入一阶矩和二阶矩，并被每个坐标不同地缩放；AdamW 则做统一收缩：
>
> $$
> \theta \leftarrow (1-\eta\lambda)\theta-\frac{\eta\hat{m}}{\sqrt{\hat{v}}+\varepsilon}
> $$
>
> 衰减仍受学习率影响，Norm 与 bias 是否衰减通常作为参数组配置单独验证。

## 核心回答

对普通 SGD，把 $$L_2$$ 正则项 $$\lambda\lVert\theta\rVert_2^2/2$$ 加入损失，与按学习率缩小权重在适当缩放下等价；对 Adam 这类自适应优化器则不等价。若把 $$\lambda\theta$$ 加进梯度，它也会进入一、二阶矩并被逐坐标归一化，实际收缩强度依赖历史梯度。AdamW 直接在优化步骤外衰减参数，使正则化不经过 Adam 的预条件器。

常见 AdamW 更新可概括为：

$$
\theta_t=(1-\eta_t\lambda)\theta_{t-1}-\frac{\eta_t\hat{m}_t}{\sqrt{\hat{v}_t}+\varepsilon}
$$

这里 Weight Decay 仍常随步学习率 $$\eta_t$$ 缩放，但它与损失梯度的动量和方差估计解耦，因此 $$\lambda$$ 的含义更清楚。

## 展开说明

在“Adam + L2”中，先令 $$g_t=\nabla\mathcal{L}(\theta)+\lambda\theta$$，再用 $$g_t$$ 更新 $$m_t$$、$$v_t$$。一个长期梯度方差很大的坐标会被 $$1/\sqrt{\hat{v}_t}$$ 强烈缩放，其 L2 项也一起被缩放；这不再是统一乘 $$(1-\eta\lambda)$$ 的 Weight Decay。AdamW 则只用任务梯度更新矩估计，另做参数收缩。

实践中常不给 bias 和归一化层的 scale 参数做衰减，因为它们维度小、作用与权重矩阵尺度不同，且归一化结构存在尺度不敏感性；这是经验选择，不是数学定律。Embedding、MoE Router 或 LoRA 参数是否衰减也应通过任务验证。

## 工程实践

配置参数组时明确列出 decay 与 no-decay 集合，并检查新模块没有默认落入错误分组。记录有效学习率与每步衰减因子；更换 Schedule、梯度累积定义或优化器实现时重新核对 $$\lambda$$ 的单位。调参应联合搜索峰值学习率和 Weight Decay，并用验证集而非训练 loss 判断正则化效果。

## 常见追问

1. **Adam 加 L2 与 AdamW 的根本差别是什么？** L2 项在 Adam 中会经过动量和二阶矩预条件；AdamW 的参数收缩不进入这些统计量。
2. **AdamW 的衰减完全独立于学习率吗？** 常见实现的每步因子仍是 $$1-\eta_t\lambda$$，所以数值强度随 Schedule 变化；“解耦”指不被梯度预条件器处理。
3. **为什么 Norm 和 bias 常放进 no-decay？** 它们的尺度角色不同且参数很少，衰减收益常不稳定；这是需消融验证的工程惯例，不是强制规则。

## 一句话复习

> AdamW 把统一的参数收缩移出 Adam 的梯度矩估计，避免 L2 项被逐坐标自适应缩放。

## 参考资料

- [Decoupled Weight Decay Regularization](https://arxiv.org/abs/1711.05101)
- [PyTorch AdamW Documentation](https://docs.pytorch.org/docs/stable/generated/torch.optim.AdamW.html)
