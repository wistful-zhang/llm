---
title: "Activation Checkpointing 如何用重计算换显存，切分点应该怎样选择？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "训练工程"
difficulty: "中等"
tags:
  - Activation Checkpointing
  - Rematerialization
  - 训练显存
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论：** Activation Checkpointing 只保存部分边界激活，反向时重跑中间前向，以额外 FLOPs 换取激活显存。
2. **再讲关键机制：** 沿 Transformer 层说明保存 checkpoint、反向恢复 RNG、重算内部激活再求梯度的过程。
3. **主动说取舍：** 切得越细显存越省但重算和调度越多；有状态算子、随机数和副作用会影响正确性。
4. **最后落到项目：** 扫描每几层一个 checkpoint，报告峰值显存、step time、tokens/s、MFU 和梯度一致性；说完停。

**60 秒口述示例：**

> 我会先说明正常反向需要保存每层激活；Activation Checkpointing 只留若干边界张量，反向到某一段时重新执行该段前向，恢复内部激活再求梯度，所以用重计算换显存。分段越多通常越省内存，但 step 更慢，还要正确恢复 Dropout 的 RNG。项目里我会扫描切分粒度，同时看峰值显存、step time、tokens/s、MFU 和与未重算基线的梯度误差。

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
