---
title: 'MoE 推理里的 Dispatch Buffer 应该怎样估算，容量不足会怎样？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'MoE'
  - 'Dispatch'
  - 'Capacity'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

按每批 Token、Top-k、专家分布和 capacity factor 解释，并说明热点专家与丢 Token 风险。

**可以这样答：**

> 每个 Token 会路由到 Top-k 专家，理想均匀时单专家负载约为 batch_tokens·k/num_experts。实际路由有偏斜，因此按 capacity factor 预留额外槽位，并监控专家负载分位数。容量不足可能丢弃、溢出到备用专家或触发动态缓冲，不同策略会影响质量或延迟。缓冲过大又占显存，在线应结合真实路由分布和 All-to-All 峰值调优。

## 常见追问

1. **Capacity factor 越大越安全吗？** 能减少溢出但增加显存和通信，热点长期存在时应改善路由或放置。
2. **为什么不同语言可能形成热点？** 专家会学到领域和语言偏好，流量分布变化会让部分专家收到更多 Token。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
