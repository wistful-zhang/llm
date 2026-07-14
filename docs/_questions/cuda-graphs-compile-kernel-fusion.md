---
title: "CUDA Graph、模型编译与 Kernel Fusion 分别优化什么？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "推理与部署"
difficulty: "中等"
tags:
  - CUDA Graph
  - torch.compile
  - Kernel Fusion
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论：** CUDA Graph 降低重复 launch 开销，模型编译做图级优化，Kernel Fusion 减少中间读写和启动次数，三者优化层级不同。
2. **再讲关键机制：** 分别解释捕获并重放固定执行图、编译器生成专用代码、融合相邻算子减少 HBM 往返。
3. **主动说取舍：** 动态图、变长 shape 和数据依赖控制流会导致重新编译或无法捕获，融合过度也可能增加寄存器压力。
4. **最后落到项目：** 用 profiler 报告 kernel 数、launch 间隙、重编译次数、吞吐和 P95 时延；说完停。

**60 秒口述示例：**

> 我会先分层回答：CUDA Graph 把稳定的一串 GPU 操作捕获后重放，主要省 CPU launch；编译器跨算子优化计算图；Kernel Fusion 把相邻计算放进一个 kernel，少写几次 HBM。它们可以叠加，但要求 shape 和控制流足够稳定。项目里我会用 profiler 比较 kernel 数、launch gap、graph 命中率、重编译次数、吞吐和 P95 延迟。动态路径较多时我会再说明 shape bucket 的使用边界。


## 核心回答

Kernel Fusion 把多个算子合成更少的 GPU Kernel，减少中间张量写回显存和 Launch 次数；模型编译器捕获计算图并做布局、常量折叠、算子选择和 Fusion 等优化；CUDA Graph 则把一串已经确定的 CUDA 操作录制后整体 Replay，重点减少 CPU 调度与逐 Kernel Launch 开销。

三者可以叠加，但适用瓶颈不同：大 GEMM 已经占满 GPU 时，减少 CPU Launch 未必明显；小 Batch Decode、许多小算子和 CPU-bound 场景更可能受益。动态 Shape、数据相关控制流、地址不稳定和不支持的算子会导致 Graph Break、重新编译或无法安全 Capture。

## 展开说明

- **Fusion** 主要优化 Kernel 边界与 HBM 往返，例如把逐元素激活、归一化或后处理融合；它不能自动降低大矩阵乘的理论计算量。
- **编译** 需要按 Shape、Dtype、设备和控制流生成 Guard；新输入不满足 Guard 时可能重新编译，造成延迟尖峰。
- **CUDA Graph** Replay 使用录制时的执行结构与内存地址，通常需要静态输入缓冲区，并在 Capture 前完成必要 Warmup。
- **内存代价** 是容易忽略的：多 Shape 编译缓存、Graph 私有内存池和 Workspace 会抬高常驻显存。

版本边界：`torch.compile` 的后端、动态 Shape 支持、Graph Break 行为与缓存策略会随 PyTorch/Triton 版本变化；CUDA Graph 的可捕获操作也受 CUDA、通信库和框架版本约束，必须以实际版本文档为准。

## 工程实践

先用 Profiler 区分 CPU Launch、Kernel 执行、同步和 HBM 瓶颈，再逐项启用优化。按输入长度和 Batch 建立有限的 Shape Bucket，记录编译次数、首次请求延迟、稳态 TPOT、Kernel 数、Graph 命中率和峰值显存；部署时预热主流 Bucket，并保留 Eager 回退路径。

## 常见追问

1. **用了 `torch.compile` 是否就一定用了 CUDA Graph？**  不一定。编译器可以只生成或融合 Kernel；是否使用 CUDA Graph 取决于后端、配置、图是否可捕获和输入约束。
2. **为什么动态长度容易造成性能抖动？**  新 Shape 可能触发 Guard 失败与重新编译，或落入 Eager 路径；可用 Bucketing、Padding 到有限形状和合理的动态 Shape 配置控制变体数量。
3. **CUDA Graph 为什么常要求固定内存地址？**  Replay 会重复执行录制的操作与指针关系；通常要把新数据复制进长期存在的静态缓冲区，而不是每次传入全新分配。

## 一句话复习

> Fusion 减少 Kernel 与显存往返，编译器优化整图，CUDA Graph 减少 CPU Launch；先判断瓶颈，再处理动态 Shape 和显存代价。

## 参考资料

- 官方文档：[PyTorch Compiler](https://docs.pytorch.org/docs/stable/torch.compiler.html)
- 官方文档：[PyTorch CUDA Graphs](https://docs.pytorch.org/docs/stable/notes/cuda.html#cuda-graphs)
