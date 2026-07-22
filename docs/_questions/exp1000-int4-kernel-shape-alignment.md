---
title: 'INT4 模型在某些 Batch 或隐藏维度下反而很慢，可能是什么原因？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'INT4'
  - '矩阵对齐'
  - 'Kernel'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从 Tensor Core 对齐、打包布局、组大小和小矩阵启动开销回答。

**可以这样答：**

> 高性能 INT4 kernel 通常要求 K、N 维和组大小满足特定倍数，未对齐会走慢路径或增加 Padding。权重打包布局若与运行时不一致，还会触发转置或重排。小 Batch 的矩阵太窄时，kernel 启动和解量化开销占比很高，理论峰值无法利用。应查看实际 kernel 名称和形状，按目标硬件选择量化配置，而不是只比较位宽。

## 常见追问

1. **Padding 到对齐维度会不会浪费？** 会增加少量计算，但可能换来更高效 kernel，需要实测净收益。
2. **同一个模型在不同 GPU 上表现一样吗？** 不会，各代硬件支持的低比特指令、带宽和 kernel 实现不同。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
