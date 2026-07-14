---
title: "为什么大模型训练常用 Warmup，常见学习率调度如何选择？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "NLP 与机器学习"
difficulty: "中等"
tags:
  - Warmup
  - 学习率
  - 优化
published: true
verified: true
date: 2026-07-14
---

## 核心回答

Warmup 在训练初期把学习率从较小值逐步升到峰值，降低随机初始化、尚未稳定的激活与优化器矩估计带来的大更新风险。峰值之后常用线性衰减、余弦衰减或 Transformer 的逆平方根调度。选择时应以总训练 Token、批量大小、优化器和是否继续预训练为条件；Warmup 不是越长越安全，过长会浪费预算并造成早期学习过慢。

## 展开说明

原始 Transformer 使用与模型维度和步数相关的 `d_model^-0.5 · min(step^-0.5, step · warmup_steps^-1.5)`。BERT 则采用 Warmup 后线性衰减。余弦调度让后期平滑接近最小学习率，适合已知固定预算；逆平方根尾部更长。调度应按优化器更新次数而非微批次数计算，使用梯度累积后尤其要区分两者。

## 工程实践

先记录峰值学习率、Warmup Token 比例、最小学习率和实际更新次数，并监控梯度范数、损失尖峰与跳过更新。大批量或新初始化模块通常需要重新搜索峰值与 Warmup；领域继续预训练若从成熟检查点开始，往往使用更低峰值和较短 Warmup。比较配方时按 Token 而不是只按 epoch 对齐。

## 常见追问

1. **Warmup 能根治训练发散吗？** 不能；数据异常、损失缩放、初始化、过高峰值学习率或数值溢出仍需分别定位。
2. **梯度累积后 Warmup step 怎样计算？** 通常按真正执行一次 `optimizer.step()` 的更新步计数，而不是每个 micro-batch 计数。
3. **继续预训练可以沿用预训练初始学习率吗？** 通常不宜直接沿用；已有权重较成熟，应以较小学习率做消融并观察遗忘和领域收益。

## 一句话复习

> Warmup 保护训练最不稳定的早期更新，后续调度负责在固定 Token 预算内兼顾学习速度与收敛。

## 参考资料

- 面试主题：[LLM Interview Questions](https://github.com/llmgenai/LLMInterviewQuestions)
- 技术依据：[Attention Is All You Need](https://arxiv.org/abs/1706.03762)、[BERT](https://arxiv.org/abs/1810.04805)
