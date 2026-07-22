---
title: "Activation Checkpointing 如何用重计算换显存，切分点应该怎样选择？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "训练工程"
difficulty: "中等"
study_tier: "role"
tags:
  - Activation Checkpointing
  - Rematerialization
  - 训练显存
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

这题要把“省了什么、重算了什么”说清楚：它只减少激活保存，不会减少参数或优化器状态。解释分段重算后，紧接着谈切分粒度与计算开销的交换，并提醒 Dropout 的 RNG 必须复现。若被问如何选切分点，再从激活大小、重算成本和层间边界来判断。

**可以这样答：**

> Activation Checkpointing 只保存若干段的边界激活，反向传播到某一段时重新执行这段前向，再计算梯度，因此是用额外计算换激活显存。切得越细通常越省显存，但重算和调度开销也越大。含 Dropout 的模块还必须恢复原前向的随机数状态，否则重算得到的激活不同，梯度就不再对应。

## 核心回答

反向传播需要前向中间激活。普通训练把它们一直保留到对应 backward，激活显存会随层数、batch 和序列长度增长。Activation Checkpointing 仅保存所选段的输入或边界状态，反向到该段时重新运行前向，临时恢复内部激活后计算梯度。

若把深度为 L 的链式网络合理分段，经典结果可把激活存储从线性量级降到近似平方根量级，同时增加一部分前向计算。现代框架也会通过选择性 checkpoint 或编译器 min-cut 在显存预算下决定重算哪些算子。

## 展开说明

它只优化激活，不会分片参数、梯度和优化器状态，因此与 ZeRO/FSDP、张量并行可以叠加。重算会增加实际硬件 FLOPs，所以 MFU 与 HFU 的解读要区分：重算可能提高硬件忙碌程度，却不代表有效训练 token 更快。

Dropout 等随机算子要求重算时复现同一随机状态，否则前后向对应不上。依赖全局可变状态、外部 I/O 或原地副作用的函数也不适合直接 checkpoint。

## 工程实践

优先 checkpoint 激活大、重算相对便宜的 Transformer block，避免对通信密集或很小的算子过度切碎。记录每个配置的峰值 allocated/reserved、前向/反向时间和通信重叠。用固定 seed 与小模型比较 loss、输出和参数梯度，确认数值误差在精度允许范围。

## 常见追问

1. **Activation Checkpointing 与模型 Checkpoint 是一回事吗？** 不是。前者是单次训练 step 内的激活重算；后者把权重和训练状态持久化，用于故障恢复。
2. **它能减少优化器状态显存吗？** 不能。优化器和参数显存需靠分片、低精度或更换优化器处理。
3. **为什么启用后训练会变慢？** 反向前需要重做部分前向，还会增加 kernel 调度，速度损失取决于切分粒度和算子成本。
4. **Dropout 下如何保证梯度正确？** 重算必须恢复与原前向一致的 RNG 状态；框架通常提供保存 RNG 的选项，但会带来额外开销。

## 一句话复习

> Activation Checkpointing 少存中间激活、反向时再算一遍；切分点决定显存与重算的交换率。

## 参考资料

- [Training Deep Nets with Sublinear Memory Cost](https://arxiv.org/abs/1604.06174)
- [PyTorch：torch.utils.checkpoint](https://docs.pytorch.org/docs/stable/checkpoint.html)
