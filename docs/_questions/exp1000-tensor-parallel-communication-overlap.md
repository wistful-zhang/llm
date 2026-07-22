---
title: 'Tensor Parallel 推理中，怎样把 All-Reduce 与计算重叠？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
tags:
  - 'Tensor Parallel'
  - 'All-Reduce'
  - '通信重叠'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明分块计算、多 Stream 和依赖边界，指出小 Batch 通信更难隐藏。

**可以这样答：**

> 张量并行的部分线性层需要在设备间聚合，通信延迟在小矩阵或跨慢链路时占比很高。可把矩阵或 Token 分块，前一块开始通信时后一块继续计算，并使用独立 Stream 与事件维护依赖。分块太细会增加 kernel 和 collective 启动开销，且并非所有层都能无依赖重叠。应通过时间线确认真正并发，并结合 NVLink 或网络拓扑安排并行组。

## 常见追问

1. **增加 Batch 能减少通信占比吗？** 通常能提高计算量并摊薄启动开销，但延迟和 KV 容量也会上升。
2. **量化通信张量可行吗？** 可以降低带宽，但需要额外量化开销和误差评估，推理支持取决于实现。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
