---
title: "如何定位大模型推理中的显存、算力与内存带宽瓶颈？"
source: "公开 LLM 推理面试题整理；依据 Roofline 与性能分析官方文档原创整理"
review_status: "待复习"
category: "工程实践"
difficulty: "困难"
tags:
  - 性能分析
  - Roofline
  - GPU 推理
published: true
verified: true
date: 2026-07-13
---

## 核心回答

先把问题拆成端到端、Prefill、Decode 和非 GPU 阶段，再用真实请求的 Trace 与 GPU profiler 找证据。显存容量瓶颈表现为 OOM、KV Cache 无法继续分配或 Batch 被迫很小；算力瓶颈是算术强度较高的 kernel 接近可用计算吞吐；内存带宽瓶颈则是计算单元未满、但 HBM 流量接近平台能力。Roofline 模型用“算术强度 = 运算量 / 数据搬运量”帮助判断 kernel 更受计算还是带宽限制。

一般而言，长输入和较大 Batch 的 Prefill 更可能形成高效大矩阵计算，低 Batch 的逐 token Decode 更容易反复读取权重而受带宽影响；这是诊断起点，不是对所有模型、硬件和并发都成立的定律。

## 展开说明

排查顺序可以是：

1. **排除外围**：分别测分词、网络、排队、调度、检索与 GPU 时间，避免把 CPU 或队列问题误判为模型慢。
2. **分阶段度量**：用 TTFT 观察排队与 Prefill，用 TPOT 观察 Decode；按输入长度、输出长度和并发切片。
3. **核对显存账**：权重、KV Cache、临时工作区、CUDA Graph 和通信 buffer 分开统计，观察碎片与峰值而非只看平均。
4. **分析 kernel**：查看 Tensor Core 使用、occupancy、访存吞吐、kernel launch 空洞、算子回退和 CPU-GPU 同步。
5. **多 GPU 通信**：把 All-Reduce/All-to-All 时间与计算重叠情况单列；互联或拓扑可能成为第四类瓶颈。

GPU 利用率是聚合信号，不能单独区分有效计算、忙等和低效 kernel。

## 工程实践

用固定模型版本和生成参数建立长度×并发矩阵，先做低开销线上指标，再对代表性窗口采集 profiler，避免全量分析扰动生产。针对证据选择优化：容量不足可量化权重或 KV、减少并发上下文；带宽受限可用低位宽、算子融合或提高有效 Batch；计算受限应检查 Tensor Core dtype、kernel、融合、模型规模和并行度；通信受限则调整并行度与拓扑。推测解码更适合作为低并发、带宽受限 Decode 的候选；高 Batch 已经计算受限时，draft 与验证开销可能降低吞吐。每次只改一类变量并复测质量和 SLO。

## 常见追问

1. 为什么 GPU 利用率高不一定代表推理效率高？
2. Prefill 与 Decode 的瓶颈为什么常常不同？
3. 怎样从 Roofline 图判断应优化计算还是数据搬运？

## 一句话复习

> 先分阶段测量，再用显存账、Roofline 和 kernel/通信 Trace 把“慢”定位为可验证的具体瓶颈。

## 参考资料

- 面试题来源：[AI Engineering Interview Questions 的 LLM 推理 Profiling 题](https://github.com/amitshekhariitbhu/ai-engineering-interview-questions)
- 技术依据：[Roofline 原论文（作者机构存档）](https://escholarship.org/uc/item/78h8v7mr)、[NVIDIA Nsight Compute Profiling Guide](https://docs.nvidia.com/nsight-compute/ProfilingGuide/index.html)、[FlashAttention 的 IO 分析](https://arxiv.org/abs/2205.14135)
