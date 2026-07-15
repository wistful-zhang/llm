---
title: "如何估算大模型训练显存，Gradient Checkpointing 省了什么？"
source: "用户提供的分级面试题单；公司归属未独立核验，技术答案依据论文或官方文档整理"
verified: true
review_status: "待复习"
category: "训练与对齐"
difficulty: "困难"
tags:
  - 训练显存
  - AdamW
  - Gradient Checkpointing
published: true
date: 2026-07-14
---

## 面试时怎么答

先列完整账本：参数、梯度、优化器状态、可能的主权重、激活、通信或算子临时区、内存碎片。静态项按参数量乘字节数，激活再结合 Micro-batch、序列长度、隐藏维度和层数估算。

Gradient Checkpointing 的回答要明确：省的是需要长期保留的激活，代价是反向前重算部分前向；它不直接减少 Adam 状态。追问实测差异时，谈 allocated、reserved 和临时峰值。

**可以这样答：**

> 训练显存应分成权重、梯度、优化器状态、FP32 主权重、前向激活、临时工作区和碎片。前几项可由参数量与数据类型直接估算，激活则随 Micro-batch、序列长度和层数增长。Gradient Checkpointing 只保存部分边界激活，反向时重算中间结果，因此用额外计算换激活显存，并不会省掉优化器状态。最终还要用峰值 allocated、reserved 和吞吐校准理论账本。

## 核心回答

训练显存至少分成模型状态、激活、临时缓冲区和运行时开销。模型状态包括参数、梯度和优化器状态；以 `N` 个参数的常见混合精度 Adam 训练为例，BF16 参数约 `2N` 字节、BF16 梯度约 `2N` 字节、FP32 一阶与二阶矩约 `8N` 字节，若另存 FP32 master weights 再加 `4N` 字节，因此模型状态常见估算约为每参数 12～16 字节，但真实值取决于优化器和框架实现。这个数字不包含激活、通信缓冲、分配器碎片和算子工作区，不能直接当作训练峰值。

激活显存取决于 micro-batch、序列长度、层数、隐藏维度、Attention 实现和需要为反向保存的张量，不能只按参数量估算。Gradient Checkpointing 只保存选定边界的激活，在反向时重算中间前向，以额外计算和训练时间换取更低的激活显存；它不直接减少参数、梯度或 Adam 状态。

## 展开说明

一份可靠显存账应至少列出：

```text
峰值显存 ≈ 参数 + 梯度 + 优化器状态 + 保存的激活
         + 临时算子工作区 + 通信缓冲区 + 分配器保留/碎片
```

Adam 为每个可训练参数维护一阶矩 `m` 和二阶矩 `v`，通常各使用 FP32；部分混合精度实现还保留 FP32 主权重。推理不需要梯度、优化器状态和反向激活，所以显存通常远低于全参数训练，但推理仍有 KV Cache 与运行时工作区。

减小 micro-batch 会直接减少单次保存的激活，再用梯度累积保持较大的有效 Batch；这会增加迭代次数或通信调度成本。FlashAttention 减少不必要的注意力中间矩阵，Checkpointing 则通过重算减少更广泛的保存激活，两者机制不同，可以组合。

## 工程实践

先用公式做下界，再以框架的峰值统计和 memory snapshot 实测。分别扫描 micro-batch、序列长度和 checkpoint 粒度，记录峰值显存、tokens/s 和 step time。发生 OOM 时查看峰值所在阶段，不能只看空闲时显存；参数分片、激活重算和优化器卸载解决的是不同项，应针对占用最大的部分选择方案。

## 常见追问

1. **为什么 AdamW 比 SGD 占更多显存？** AdamW 通常为每个参数维护一阶矩和二阶矩，而无动量 SGD 不需要这两份状态。
2. **为什么训练显存远大于推理显存？** 训练还要保存梯度、优化器状态和反向所需激活；推理主要保留权重、KV Cache 和工作区。
3. **Gradient Checkpointing 会减少优化器状态吗？** 不会；它只针对为反向保存的激活，用重算换显存。
4. **梯度累积为什么可能帮助显存？** 它允许用较小 micro-batch 多次累积近似大有效 Batch，从而降低每次前后向的激活峰值。

## 一句话复习

> 训练显存要把模型状态、激活和临时开销分账；Checkpointing 只用额外前向重算换取激活显存。

## 参考资料

- [Adam: A Method for Stochastic Optimization](https://arxiv.org/abs/1412.6980)
- [Mixed Precision Training](https://arxiv.org/abs/1710.03740)
- [PyTorch：Activation Checkpointing](https://docs.pytorch.org/docs/stable/checkpoint.html)
- [ZeRO: Memory Optimizations Toward Training Trillion Parameter Models](https://arxiv.org/abs/1910.02054)
- [FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135)
