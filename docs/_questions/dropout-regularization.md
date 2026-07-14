---
title: "Dropout 为什么能正则化，训练和推理时有何不同？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "NLP 与机器学习"
difficulty: "简单"
tags:
  - Dropout
  - 正则化
  - 训练推理
published: true
verified: true
date: 2026-07-14
---

## 核心回答

Dropout 在训练时随机把一部分激活置零，迫使网络不能长期依赖少数特征的共同适配，可看作对大量共享参数子网络的随机训练。常见“倒置 Dropout”会把保留激活除以保留概率，使训练期激活期望与推理期一致；推理时关闭随机丢弃，直接使用完整网络。

## 展开说明

设丢弃率为 `p`，训练时可写为 `y = mask ⊙ x / (1-p)`，其中 `mask ~ Bernoulli(1-p)`；推理时 `y=x`。Dropout 注入的是乘性噪声，其正则效果与数据规模、归一化、残差结构和位置相关。它与严格训练多个独立模型再平均并不完全等价，“近似模型集成”应作为直觉而非精确结论。

## 工程实践

确认 `train()` 与 `eval()` 模式切换正确，否则验证分数会抖动或线上输出不稳定。Transformer 可分别设置残差、Attention 权重和 FFN Dropout；大规模预训练数据充足时常使用较低甚至零 Dropout，而小数据微调可能受益。比较实验要固定随机种子并跑多次，因为 Dropout 会增加方差。

## 常见追问

1. **为什么训练时要除以 `1-p`？** 这样保留激活的期望不变，推理时无需再额外缩放。
2. **Dropout 会减少参数量或推理计算吗？** 标准 Dropout 不会；推理仍使用完整网络，它是训练正则而非结构剪枝。
3. **推理时保持 Dropout 有什么用途？** 多次随机前向可用于 Monte Carlo Dropout 近似估计不确定性，但延迟增加且需要验证校准质量。

## 一句话复习

> Dropout 训练时随机屏蔽并按保留概率缩放，推理时关闭；它用随机子网络扰动抑制共同适配。

## 参考资料

- 面试主题：[LLMs Interview Questions](https://github.com/Devinterview-io/llms-interview-questions)
- 技术依据：[Improving neural networks by preventing co-adaptation of feature detectors](https://arxiv.org/abs/1207.0580)
