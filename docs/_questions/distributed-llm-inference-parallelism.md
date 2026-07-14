---
title: "大模型多 GPU 推理中，张量、流水线和数据并行应该如何组合？"
source: "公开 LLM 推理面试题整理；依据 Megatron 与推理系统论文原创整理"
review_status: "待复习"
category: "工程实践"
difficulty: "困难"
tags:
  - Tensor Parallel
  - Pipeline Parallel
  - 分布式推理
published: true
verified: true
date: 2026-07-13
---

## 核心回答

先用单卡或单节点能容纳模型的最小并行度满足显存，再扩副本提高吞吐。张量并行把一层内的矩阵切到多张 GPU，可降低单设备权重和计算量，但几乎每层都有集合通信，适合节点内高速互联；流水线并行按层分段，跨阶段传激活，通信频率较低，但会产生流水线气泡和最慢阶段瓶颈；数据并行复制完整服务副本，适合相互独立请求，主要提升总吞吐而不是让单个请求跨副本加速。

典型选择是节点内做张量并行，模型跨节点仍放不下时再叠加流水线并行，最后用多个相同并行组做数据并行。并行度越大不一定越快，通信、负载不均和可用副本数都会改变结果。

## 展开说明

评估方案时要同时看内存、延迟和故障域：

- **张量并行**需要高带宽、低延迟互联；跨慢网络 All-Reduce 可能让逐 token 解码尤其受损。
- **流水线并行**可以跨节点放置层，但在线小 Batch 下不容易填满流水线，应平衡各阶段的层数和计算量。
- **数据并行**让每个副本独立调度，隔离较好；代价是每个副本都保存完整并行组的权重。
- **Expert Parallel**适用于 MoE，把专家分散到设备，但 token 路由会产生 All-to-All 和热点专家问题。
- **Context Parallel**沿序列维度切分输入和各层激活，Attention 需要跨卡交换 K/V，主要服务超长上下文。
- **Sequence Parallel**的含义依实现而异；在 Megatron 中，它主要沿序列维度切分 LayerNorm、Dropout 等激活并与 Tensor Parallel 配合，不能与 Context Parallel 视为同义词。

训练时采用的切分方式也不必原样用于推理；推理没有优化器状态，最佳并行度可能更小。

## 工程实践

先测每种模型、精度和长度组合的单组拓扑，再扫描 TP/PP 大小，记录 TTFT、TPOT、吞吐、显存、通信时间和故障恢复。调度器应感知 NVLink/PCIe/机架拓扑，把同一张量并行组放在高速故障域内；部署升级时一次替换完整并行组，健康检查必须确认所有 rank 就绪后才接流量。

## 常见追问

1. 为什么张量并行跨节点后常出现明显性能下降？
2. 流水线并行的气泡从哪里来，在线推理为何更难填满？
3. 模型已经能放进一张 GPU 时，为什么通常先扩副本而不是继续切模型？

## 一句话复习

> 用最小模型并行度解决“放得下”，再用数据并行解决“扛得住”，并用实测权衡通信与延迟。

## 参考资料

- 面试题来源：[AI Engineering Interview Questions 的推理并行题](https://github.com/amitshekhariitbhu/ai-engineering-interview-questions)
- 技术依据：[Megatron-LM 论文](https://arxiv.org/abs/1909.08053)、[DeepSpeed Inference 论文](https://arxiv.org/abs/2207.00032)、[vLLM Parallelism and Scaling](https://docs.vllm.ai/en/stable/serving/parallelism_scaling/)、[NVIDIA Megatron Context Parallel 文档](https://docs.nvidia.com/megatron-core/developer-guide/latest/user-guide/features/context_parallel.html)
