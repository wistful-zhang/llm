---
title: '为什么单请求 Decode 往往受显存带宽限制，怎样用 Roofline 思路解释？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Decode'
  - 'Roofline'
  - '显存带宽'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

解释每步读取大量权重只计算少量 Token，算术强度低；再说明批处理如何复用权重。

**可以这样答：**

> 自回归 Decode 每一步只生成少量 Token，却要读取大部分模型权重和 KV Cache，单位字节对应的计算量较低。Roofline 中性能上限取决于 min(峰值算力，带宽×算术强度)，低算术强度时先碰到带宽屋顶。增加批次能让一次权重读取服务更多 Token，提高算术强度，但同时增加 KV 访问和延迟。量化权重减少传输字节也可能提速，前提是解量化 kernel 足够高效。

## 常见追问

1. **Prefill 也一定是带宽瓶颈吗？** 不一定，较大矩阵乘和长序列能提高算术强度，常更偏算力受限。
2. **GPU 利用率高就说明算力受限吗？** 不说明，利用率只表示设备忙，仍需看带宽、Tensor Core 和 kernel 指标。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
