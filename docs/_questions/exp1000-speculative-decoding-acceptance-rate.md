---
title: '推测解码的 Acceptance Rate 由什么决定，为什么高接受率不等于高加速？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
tags:
  - '推测解码'
  - 'Acceptance Rate'
  - '加速'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明草稿与目标分布一致性、验证长度和额外开销，共同比较每单位时间接受 Token。

**可以这样答：**

> 接受率取决于草稿模型提议 Token 与目标模型分布的一致程度，并受任务、采样参数和草稿长度影响。即使接受率高，草稿生成、目标批量验证和同步开销也可能抵消收益。真正要看单位时间最终接受的 Token，以及对 TTFT、TPOT 和吞吐的影响。草稿长度过长会增加被拒后的浪费，应随在线接受率动态调整。

## 常见追问

1. **Temperature 提高会怎样？** 草稿与目标采样更易分歧，接受率通常下降，具体取决于验证算法。
2. **贪心解码最适合推测解码吗？** 分布更稳定通常有利，但目标与草稿模型差异仍决定最终收益。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
