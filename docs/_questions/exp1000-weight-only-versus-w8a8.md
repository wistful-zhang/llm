---
title: 'Weight-only INT4 和 W8A8 推理应该怎样选择？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Weight-only'
  - 'W8A8'
  - '性能'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从权重带宽、激活量化、硬件 Tensor Core 和模型质量比较。

**可以这样答：**

> Weight-only INT4 大幅压缩权重，矩阵乘前仍需解量化到较高精度，适合 Decode 带宽受限和显存紧张场景。W8A8 同时量化权重与激活，支持的硬件上可直接使用整数矩阵单元，Prefill 吞吐更有优势。激活量化更容易受离群值影响，校准和精度风险通常更高。最终要按 Prefill 与 Decode 流量比例、硬件 kernel 和任务质量选择。

## 常见追问

1. **INT4 权重一定比 INT8 更快吗？** 不一定，若 INT4 kernel 或解量化效率差，理论带宽优势无法兑现。
2. **W8A8 是否一定省一半显存？** 模型权重会省，但 KV Cache、工作区和其他模块不一定按同比例变化。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
