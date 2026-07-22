---
title: '怎样粗略估算一条长 Prompt 的 Prefill 计算量？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
tags:
  - 'Prefill'
  - 'FLOPs'
  - '容量估算'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明线性投影项与注意力二次项，并强调 FlashAttention 不改变理论算术量。

**可以这样答：**

> 对层数 L、序列长 S、隐藏维 d 的 Decoder，线性层主要量级约为 L·S·d²，完整注意力的分数计算量级约为 L·S²·d。常见模型在中等长度下线性投影仍占很大比例，极长上下文时 S² 项快速上升。FlashAttention 减少中间读写和显存，不把标准全注意力的算术复杂度改成线性。实际容量估算还要用目标硬件上的 kernel、批大小和精度做校准。

## 常见追问

1. **为什么 Prompt 加倍，TTFT 不一定正好加倍？** 注意力二次项、批处理、缓存命中和硬件利用率都会造成非线性。
2. **Prefix Cache 命中后还需计算什么？** 已缓存前缀的 KV 可复用，只需处理未命中的后缀和调度开销。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
