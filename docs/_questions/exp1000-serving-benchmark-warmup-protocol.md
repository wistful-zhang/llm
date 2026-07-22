---
title: '为什么 LLM 压测前要 Warmup，预热到什么程度才算稳定？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Warmup'
  - '压测'
  - '冷启动'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

覆盖权重驻留、kernel 编译、CUDA Graph、缓存和频率稳定，并区分冷启动指标。

**可以这样答：**

> 首次请求可能触发权重分页、JIT 编译、自动调优、CUDA Graph 捕获和缓存填充，不能代表稳态性能。预热使用与正式压测相似的长度和形状，直到吞吐、显存和时钟连续多个窗口稳定。预热流量不计入稳态统计，但冷启动本身应单独作为上线指标测量。每次变更模型、kernel 或实例后重新预热，不能复用旧结论。

## 常见追问

1. **只发一个短请求能预热吗？** 通常不够，未覆盖的 Batch 和长度形状仍可能在正式测试时编译或捕获。
2. **Prefix Cache 要不要预热？** 根据测试目标决定，测冷缓存与真实热缓存应分别报告，不能混在一起。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
