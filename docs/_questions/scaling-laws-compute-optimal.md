---
title: "Scaling Laws 与计算最优训练说明了什么？"
source: "公开真实面试问题汇总中的 Scaling Laws 高频题；答案依据 Kaplan 与 Chinchilla 论文原创整理"
review_status: "待复习"
category: "LLM 基础"
difficulty: "困难"
tags:
  - Scaling Laws
  - Chinchilla
  - 预训练
published: true
verified: true
date: 2026-07-13
---

## 核心回答

Scaling Laws 是在特定数据、模型族和训练设置下观察到的经验规律：语言模型损失会随参数量、训练 token 数和计算量增加而近似按幂律下降。它的工程价值是预测扩展收益，并在固定算力下分配模型规模与数据量。Kaplan 等人的早期结果更强调大模型的样本效率；Chinchilla 重新研究固定计算预算后指出，当时许多模型参数过大而训练 token 不足，模型规模和数据量应更均衡地扩展。二者不是互相否定，而是实验范围和最优目标不同。

## 展开说明

计算最优并不等于“参数越多越好”。在预算固定时，参数过多会导致每个参数看到的数据不足；参数过少又可能限制容量。Chinchilla 的核心结论是在其研究范围内，模型参数翻倍时训练 token 也应大致同比增加，从而更有效地使用训练 FLOPs。

这些规律主要拟合平均交叉熵，不能直接保证某个下游能力、事实正确性或安全性按同样曲线增长。数据质量、重复率、语言分布、架构和训练稳定性变化后，原有拟合参数也可能失效。所谓“涌现”还可能受到指标离散化和测量方式影响，不能仅凭曲线外推下结论。

## 工程实践

正式扩容前应训练多个小规模点，记录有效 token、训练 FLOPs、验证损失和下游任务指标，再拟合本项目自己的曲线。预算还要包含数据处理、失败重跑和超参数试验。若部署成本重要，应把推理吞吐、显存和预期调用量一起纳入，而不只优化一次预训练的计算量。

## 常见追问

1. 为什么固定计算预算下，模型过大也可能不是最优方案？
2. Kaplan 与 Chinchilla 的结论为什么看起来不同？
3. 验证损失的 Scaling Law 能否直接预测推理和安全能力？

## 一句话复习

> Scaling Laws 用经验曲线预测扩展收益；计算最优训练要求在参数、数据和算力之间配平，而不是只堆参数。

## 参考资料

- 面试主题：[Datawhale 的 LLM、VLM 与 Agent 面试问题总结](https://github.com/datawhalechina/hello-agents/blob/main/Extra-Chapter/Extra01-%E9%9D%A2%E8%AF%95%E9%97%AE%E9%A2%98%E6%80%BB%E7%BB%93.md)
- 技术依据：[Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361)、[Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556)
