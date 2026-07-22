---
title: "GPipe、1F1B 与交错流水线如何影响 Bubble？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "训练工程"
difficulty: "困难"
study_tier: "role"
tags:
  - Pipeline Parallel
  - 1F1B
  - Bubble
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

流水线调度从 Micro-batch 如何填满 Stage 讲起：GPipe 先全前向后反向，简单但激活驻留多；1F1B 稳态交替，显存更低；交错让设备承担多个虚拟 Stage，进一步减 Bubble。更多 Micro-batch 不一定更快，小矩阵效率和通信也会成为限制。

**可以这样答：**

> GPipe 会先完成一批 Micro-batch 的前向再统一反向，实现简单但要保存较多激活；1F1B 在稳态交替执行前向和反向，激活显存更低；交错流水线让每个设备承担多个虚拟 Stage，可进一步减少空闲。Micro-batch 增多能降低 Bubble，但过小的矩阵和额外通信也可能抵消收益。

## 核心回答

流水线并行把模型层切到 $$p$$ 个 Stage，并把一个 Batch 切成 $$m$$ 个 Microbatch。GPipe 采用 Fill-Drain：先流水执行全部 Forward，再执行全部 Backward，语义简单且没有权重陈旧，但需要较长时间保存多个 Microbatch 的激活。同步 1F1B 在 Warmup 后交替一个 Forward 和一个 Backward，通常降低峰值激活内存，但仍有填充和排空 Bubble。

交错流水线让每个物理设备承载多个非连续的 Virtual Stage，可缩短有效流水段并减少 Bubble；代价是更多点对点通信、更复杂的时序与负载均衡。优化目标不是只让 Stage 数更多，而是让各 Stage 耗时接近，并用足够 Microbatch 摊薄边界空闲。

## 展开说明

在各 Stage 等时、忽略通信的简化模型中，基本 Fill-Drain 的 Bubble 比例可近似为 $$\frac{p-1}{m+p-1}$$；因此 $$m$$ 相对 $$p$$ 越大，Bubble 越小。但更多 Microbatch 会改变 Kernel 效率、梯度累积和调度开销。

- **GPipe**：调度直观，激活驻留较多，可结合重计算省显存。
- **1F1B Flush**：同一全局 Batch 内保持同步权重，并让激活更早释放；不要与异步、可能存在 Weight Staleness 的 PipeDream 变体混为一谈。
- **Interleaving**：减少有效 Bubble，但提高通信频率，只有高速互联和合理层切分时才划算。
- **不均衡**：最慢 Stage 决定节拍，Embedding、Loss、MoE 或不同层成本会破坏“按层数均分”的假设。

版本边界：论文中的调度名称在框架中可能对应不同的 Flush、Virtual Stage 和通信实现；应核对所用 Megatron/框架版本是否保持同步权重以及是否支持交错与重计算组合。

## 工程实践

用时间线 Profiler 测每个 Stage 的 Forward、Backward、Send/Recv 和空闲区间，调整层分配、Microbatch 数与 Virtual Stage。验收同时看 Bubble、激活峰值、通信字节、MFU、收敛和每步时间；只看理论公式会漏掉真实 Kernel 与链路不均衡。

## 常见追问

1. **为什么 Microbatch 越多不一定越快？**  它能摊薄 Bubble，但单个 Microbatch 太小会降低 GEMM 效率，并增加调度和通信次数，存在硬件相关的最优点。
2. **1F1B 为什么通常比 GPipe 省激活显存？**  Warmup 后某 Microbatch 的 Backward 更早到来，其激活可及时释放；GPipe 要到全部 Forward 完成后才开始 Backward。
3. **怎样判断 Stage 切分不均衡？**  看稳态时间线中各 Stage 的计算时间和等待时间；若某 Stage 持续忙而邻居等待，应移动层或单独处理重型模块，而不是只增加 Microbatch。

## 一句话复习

> GPipe 简单但激活多，1F1B 更早回收激活，交错调度进一步压 Bubble；最终性能由 Microbatch、Stage 均衡和通信共同决定。

## 参考资料

- 原始论文：[GPipe: Efficient Training of Giant Neural Networks using Pipeline Parallelism](https://arxiv.org/abs/1811.06965)
- 原始论文：[Efficient Large-Scale Language Model Training on GPU Clusters Using Megatron-LM](https://arxiv.org/abs/2104.04473)
