---
title: "ZeRO-2、ZeRO-3 与 FSDP 如何切分训练显存？"
source: "大厂公开真实面试案例中的 ZeRO/FSDP 分布式训练题；答案依据 ZeRO 论文与 PyTorch 官方文档原创整理"
review_status: "待复习"
category: "训练与对齐"
difficulty: "困难"
tags:
  - ZeRO
  - FSDP
  - 分布式训练
published: true
verified: true
date: 2026-07-13
---

## 面试时怎么答

先用一句递进关系说明 ZeRO：Stage 1 分优化器状态，Stage 2 再分梯度，Stage 3 连参数也分。然后把 FSDP FULL_SHARD 对应到 Stage 3 的思想，讲计算前 All-Gather 当前模块参数、反向后 Reduce-Scatter 梯度。

深挖一般落在“为什么显存仍会峰值”或 Checkpoint。说明参数聚合和临时 Buffer 仍有瞬时占用，分片保存、加载与重分片也增加工程复杂度。

**可以这样答：**

> ZeRO-1 只切分优化器状态，ZeRO-2 再切分梯度，ZeRO-3 连参数也分散到各 Rank。FSDP 的 FULL_SHARD 与 ZeRO-3 思路接近：模块计算前聚合所需参数，反向后把梯度 Reduce-Scatter 回各卡。分片越彻底，常驻显存越低，但通信、瞬时参数聚合和 Checkpoint 处理更复杂。选型应同时比较峰值显存、MFU、通信占比、保存恢复时间与扩展效率。

## 核心回答

普通数据并行在每张卡复制完整参数、梯度和优化器状态。ZeRO Stage 1 只切分优化器状态，Stage 2 再切分梯度，Stage 3 连参数也切分；阶段越高，单卡常驻模型状态越少，但通信、调度和检查点更复杂。PyTorch FSDP 的 `FULL_SHARD` 策略也对参数、梯度和优化器状态做分片，在模块计算前 All-Gather 所需参数、反向后 Reduce-Scatter 梯度，思想上接近 ZeRO-3，但接口、执行时机和实现生态并不完全等同。

## 展开说明

以 Adam 混合精度训练为例，模型参数之外还有主权重、两个优化器矩和梯度，优化器状态往往比直觉中更占显存。ZeRO-2 能显著减少梯度与优化器副本，但每张卡仍需容纳完整参数；当单卡连参数都放不下时，通常需要 ZeRO-3、FSDP `FULL_SHARD` 或模型并行。FSDP 还支持 `SHARD_GRAD_OP`、`NO_SHARD` 和 `HYBRID_SHARD` 等策略，不能把所有 FSDP 配置都等同于 ZeRO-3。

ZeRO Stage 3 与 FSDP `FULL_SHARD` 会在前向与反向按需聚合参数，因此节省常驻显存，却增加通信并产生瞬时峰值。Activation Checkpointing 处理的是激活，不属于 ZeRO 分片；Tensor/Pipeline Parallel 切分计算图，也与数据并行状态分片互补。

## 工程实践

选型前拆分测量参数、梯度、优化器、激活和临时缓冲区。模型能放下时可先用 ZeRO-2 降低复杂度；参数本身放不下再考虑更强分片。FSDP `FULL_SHARD` 要设置合理的 auto-wrap、mixed precision、prefetch 和 checkpoint 方案，并用真实网络拓扑压测吞吐。保存检查点时要明确分片或聚合格式及恢复所需 world size。

## 常见追问

1. **ZeRO-2 为什么不能解决“完整参数单卡放不下”？** ZeRO-2 只分片优化器状态和梯度，每个 Rank 仍常驻完整参数；参数本身超过单卡容量时需要 ZeRO-3、FULL_SHARD 或模型并行。
2. **FSDP 前向计算前为什么需要 All-Gather？** 每个 Rank 平时只保存参数分片，模块执行矩阵计算前必须临时聚合完整参数，计算后再释放或重新分片。
3. **Activation Checkpointing 与 ZeRO 分别优化哪部分显存？** Checkpointing 减少为反向保存的激活并用重算换空间；ZeRO/FSDP 分片参数、梯度和优化器状态，二者可组合。

## 一句话复习

> ZeRO 从优化器、梯度到参数逐级分片；FSDP FULL_SHARD 按模块聚合和再分片完整训练状态，以通信复杂度换单卡显存。

## 参考资料

- 面试主题：[AgentGuide 大厂真实面经案例集](https://github.com/adongwanai/AgentGuide/blob/main/docs/04-interview/12-company-interview-cases.md)
- 技术依据：[ZeRO](https://arxiv.org/abs/1910.02054)、[PyTorch FSDP 官方文档](https://docs.pytorch.org/docs/stable/fsdp.html)
