---
title: '模型更小了却没有更快，怎样判断瓶颈在解量化 Kernel？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
tags:
  - '解量化'
  - 'Kernel'
  - 'Profiling'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

对比内核时间、带宽、融合程度和形状利用率，不能只看权重文件大小。

**可以这样答：**

> 用 GPU Profiler 查看低比特矩阵乘是否调用目标 kernel，还是先单独解量化再走普通 GEMM。若解量化 kernel 占比高、产生大中间张量或 Tensor Core 利用率低，压缩带宽收益会被抵消。检查组大小、矩阵维度和批形状是否满足高性能 kernel 的对齐要求。与同硬件上的 BF16、INT8 基线按 Prefill 和 Decode 分别比较，才能判断量化格式是否适合当前流量。

## 常见追问

1. **融合解量化是什么意思？** 在矩阵乘加载权重时直接解码并计算，避免把完整浮点权重写回显存。
2. **小模型更容易看不到加速吗？** 是，调度、启动和 CPU 开销占比更高，低比特 kernel 优势可能不足。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
