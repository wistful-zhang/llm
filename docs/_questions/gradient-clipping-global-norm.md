---
title: "梯度裁剪为什么常按 Global Norm 做，应该在训练流程的哪个位置执行？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "训练工程"
difficulty: "中等"
study_tier: "role"
tags:
  - Gradient Clipping
  - Global Norm
  - 训练稳定性
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

公式回答最清楚：把所有参数梯度拼成一个向量，若全局范数超过阈值 $$c$$，就整体乘 $$c/\lVert g\rVert_2$$，所以方向基本不变。混合精度下必须先 Unscale，再裁剪；分布式训练要确保范数是全局口径。最后说明它只能限制有限的大梯度，已经出现 NaN 时裁剪救不回来。

**可以这样答：**

> Global Norm Clipping 把所有参数梯度视为一个长向量，若其范数 $$\lVert g\rVert_2$$ 超过阈值 $$c$$，就把全部梯度统一乘以 $$c/\lVert g\rVert_2$$，从而限制更新幅度并基本保持方向。混合精度训练必须先将梯度 Unscale，分布式训练也要基于全局梯度口径计算范数，然后再执行优化器 Step。它能缓解梯度尖峰，但不能修复已经产生的 NaN。

## 核心回答

令所有参数梯度拼接为 $$g$$，阈值为 $$c$$。Global Norm Clipping 使用：

$$
g'=g\min\!\left(1,\frac{c}{\lVert g\rVert_2+\varepsilon}\right)
$$

范数不超阈值时不改变；超过时所有分量按同一比例缩放，因此比逐元素截断更能保留原始梯度方向。

训练流程的顺序很关键。FP16 GradScaler 下应先反向得到缩放梯度，再 `unscale_`，检查有限值并裁剪，最后 optimizer step/update。数据并行中若梯度已经 all-reduce，则本地每个副本看到相同全局平均梯度；使用分片梯度时要由框架计算跨 shard 的 global norm。

## 展开说明

梯度爆炸常来自深层 Jacobian 连乘、异常 batch、过大学习率或数值错误。裁剪相当于对单步更新加信赖域式限制，可减少一次坏 batch 污染优化器状态。但若每步都触发，实际学习率和方向被系统性改变，说明阈值、数据或优化配置需要重新诊断。

Value clipping 会把每个梯度元素截到区间，可能严重改变方向；per-parameter norm clipping 又会改变不同层的相对尺度。Global norm 是常见默认，但并非任何模型都最优。

## 工程实践

阈值应结合稳定训练阶段的范数分布，而不是只抄配置。记录裁剪前 global norm、缩放因子、各层梯度 RMS 和触发率。出现 spike 时回溯原始样本、loss 各项与首个非有限算子。做消融时同时比较稳定性和达到目标验证 loss 的 token 数，防止“没崩”却训练过慢。

## 常见追问

1. **梯度已经是 NaN 时裁剪能修好吗？** 不能。NaN 参与范数和缩放后仍是 NaN，应跳过更新并定位前向、loss 或混合精度错误。
2. **为什么 AMP 要先 unscale 再裁剪？** 否则裁的是乘过 loss scale 的梯度，阈值失去真实单位，还可能把本来正常的更新误判为过大。
3. **逐元素裁剪与 Global Norm Clipping 有何不同？** 逐元素裁剪单独截断每个分量，会改变向量方向；Global Norm 统一缩放，更保留方向。
4. **裁剪触发率越高越好吗？** 不是。频繁触发通常表示阈值太低、学习率过大或数据异常，可能使有效步长长期受压。

## 一句话复习

> Global Norm Clipping 保方向、限总幅；先 unscale、再按全局口径裁剪，NaN 仍要追根因。

## 参考资料

- [On the difficulty of training Recurrent Neural Networks](https://arxiv.org/abs/1211.5063)
- [PyTorch：clip_grad_norm_](https://docs.pytorch.org/docs/stable/generated/torch.nn.utils.clip_grad_norm_.html)
- [PyTorch：AMP Gradient Clipping](https://docs.pytorch.org/docs/stable/notes/amp_examples.html#gradient-clipping)
