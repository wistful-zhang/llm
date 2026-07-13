---
title: "Pre-Norm 与 Post-Norm 有什么区别？"
source: "公开面经高频主题；答案依据论文和官方文档原创整理"
review_status: "待复习"
category: "LLM 基础"
difficulty: "困难"
tags:
  - Transformer
  - LayerNorm
published: true
date: 2026-07-13
---

## 核心回答

区别在于 LayerNorm 相对残差分支的位置。Post-Norm 通常写成 y = LN(x + F(x))；Pre-Norm 通常写成 y = x + F(LN(x))，并在网络末尾再做一次归一化。Pre-Norm 给残差主干提供了更直接的梯度路径，深层模型通常更容易稳定训练；Post-Norm 往往更依赖初始化、学习率和 Warmup 等训练配方。

## 展开说明

原始 Transformer 使用 Post-Norm。在 Xiong 等人的均场理论假设下，Post-Norm 初始化时靠近输出层的期望梯度较大，因此使用较大学习率可能不稳定；Warmup 可以缓解这一问题。Pre-Norm 把归一化放到子层之前，使残差路径更接近恒等映射，梯度传播通常更平稳。

这不意味着 Pre-Norm 在所有任务上都必然更好。模型深度、残差缩放、初始化、优化器和归一化变体都会影响最终效果。回答时应把“更易优化”和“最终能力更强”区分开。

## 工程实践

排查深层模型训练不稳定时，应同时查看梯度范数、损失尖峰、学习率曲线、混合精度溢出和不同深度层的激活分布。切换 Norm 位置属于架构变化，不能直接加载所有旧权重后假设行为不变。

## 常见追问

1. 为什么 Pre-Norm 的梯度路径更直接？
2. Post-Norm 为什么更依赖 Warmup？
3. RMSNorm 与 LayerNorm 的差异是什么？

## 一句话复习

> Pre-Norm 更偏向稳定优化，Post-Norm 更依赖训练配方，二者不是无条件的优劣关系。

## 参考资料

- 面经主题：[牛客大模型高频面试题整理](https://www.nowcoder.com/discuss/865888054261706752)
- 技术依据：[On Layer Normalization in the Transformer Architecture](https://arxiv.org/abs/2002.04745)
