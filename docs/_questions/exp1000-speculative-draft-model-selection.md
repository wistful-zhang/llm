---
title: '推测解码里的 Draft Model 应该怎样选，越小越好吗？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '中等'
tags:
  - 'Draft Model'
  - '推测解码'
  - '延迟'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

平衡草稿速度和与目标模型的一致性，说明同 Tokenizer 与领域匹配的重要性。

**可以这样答：**

> 草稿模型要比目标模型快很多，同时输出分布足够接近，过小会因接受率低失去收益。共享 Tokenizer 和词表能简化验证，领域、语言和对齐风格也应相近。可在真实流量上测每次提议成本、接受长度和目标验证成本，选择端到端最优而非参数最少。部署还要计入额外模型显存，避免挤压目标模型并发。

## 常见追问

1. **可以把目标模型量化版当草稿吗？** 可以尝试，架构与分布接近可能有利，但两份权重和执行成本仍需比较。
2. **不同 Tokenizer 能工作吗？** 部分方法支持，但需要复杂的 Token 对齐，工程和验证开销更高。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
