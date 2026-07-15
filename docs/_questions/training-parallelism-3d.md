---
title: "数据并行、张量并行和流水线并行如何组成 3D 并行？"
source: "用户提供的分级面试题单；公司归属未独立核验，技术答案依据论文或官方文档整理"
verified: true
review_status: "待复习"
category: "训练与对齐"
difficulty: "困难"
tags:
  - 数据并行
  - 张量并行
  - 流水线并行
  - 3D Parallelism
published: true
answer_status: complete
date: 2026-07-14
---

## 面试时怎么答

先明确三种切分维度：DP 切样本，TP 切一层内部的矩阵，PP 切连续层。接着分别说主要通信——梯度归约、层内集合通信、Stage 间激活传递——这样三者如何组合就很自然。

设计追问可以按约束回答：单层放不下先增加 TP，整模型仍放不下再切 PP，剩余规模用于 DP；实际顺序还要服从节点拓扑、全局 Batch 和流水线气泡。

**可以这样答：**

> 数据并行让各副本处理不同样本并归约梯度；张量并行把单层矩阵分到多卡，每层都需要集合通信；流水线并行把连续层分成多个 Stage，用 Micro-batch 填充。三维并行就是同时在这三个方向切分。通常把通信最频繁的 TP 放在节点内高速互联上，再按显存和节点划分 PP，剩余卡组成 DP，并用显存余量、通信占比、气泡率和 MFU 调整组合。

## 核心回答

数据并行（DP）复制模型、切分训练样本，并在反向时聚合梯度；张量并行（TP）把单层矩阵沿输入或输出维度切到多卡，层内需要频繁集合通信；流水线并行（PP）按连续层切分模型，用多个 micro-batch 填充各阶段，但会产生流水线气泡。3D 并行把三者组合：

```text
world_size = DP_degree × TP_degree × PP_degree  （未再叠加 CP、EP 等维度时）
global_batch = micro_batch × DP_degree × 每步累积的 micro-batch 数
```

常见思路是用 TP 解决单层放不下，用 PP 解决整组层放不下，再用 DP 扩展数据吞吐；实际组合必须结合显存、互联拓扑、Batch 和通信实测。

## 展开说明

三种并行切分的是不同维度：

- **DP** 切数据，通信通常围绕梯度 bucket；普通 DDP 每卡保留完整模型，FSDP/ZeRO 则进一步分片模型状态。
- **TP** 切层内张量，Transformer 多个子层需要 All-Reduce、Reduce-Scatter 或 All-Gather，适合节点内高速互联。
- **PP** 切层，阶段之间传递激活及其梯度；若阶段计算不平衡，最快阶段也必须等待最慢阶段。

对简单 fill-drain 流水线，`p` 个阶段、`m` 个 micro-batch 的理想化气泡比例约为 `(p-1)/(m+p-1)`；增大 `m` 可降低气泡比例，但会改变激活、调度和有效 Batch。3D 并行不是卡数的任意因式分解：TP 过大会让层内通信占主导，PP 过大会增加气泡，DP 过小则难以利用数据并行吞吐。

## 工程实践

先确定单卡可容纳的 micro-batch，再从能放下模型的最小 TP/PP 开始扫描。把同一 TP 组尽量放在 NVLink/NVSwitch 等高速域内，跨节点优先承担通信频率较低的维度。压测记录每阶段显存、计算时间、集合通信、气泡比例和每 GPU tokens/s；优化时先平衡 PP 各阶段，再讨论增加总卡数。

## 常见追问

1. **TP 为什么通常比 PP 更依赖高速互联？** TP 在许多层内都发生集合通信，而 PP 主要在阶段边界传激活和梯度。
2. **PP 的气泡从哪里来？** 流水线填充、排空以及阶段不平衡时，部分设备没有可执行的 micro-batch。
3. **DP 是否能解决单层权重放不下？** 普通 DDP 不能，因为每个副本都有完整模型；需要 TP、参数分片或其他模型并行。
4. **卡数增加为什么训练不一定更快？** 计算被切小后，通信、气泡、负载不均和全局 Batch 变化都可能抵消并行收益。

## 一句话复习

> DP 切数据、TP 切层内张量、PP 切连续层；3D 并行用最小模型并行度解决显存，再用数据并行扩吞吐。

## 参考资料

- [Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism](https://arxiv.org/abs/1909.08053)
- [GPipe: Efficient Training of Giant Neural Networks using Pipeline Parallelism](https://arxiv.org/abs/1811.06965)
- [Efficient Large-Scale Language Model Training on GPU Clusters Using Megatron-LM](https://arxiv.org/abs/2104.04473)
- [PyTorch：DistributedDataParallel](https://docs.pytorch.org/docs/stable/generated/torch.nn.parallel.DistributedDataParallel.html)
