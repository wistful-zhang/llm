---
title: 'Paged KV Cache 的 Block Size 选大选小分别有什么影响？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
tags:
  - 'Paged KV'
  - 'Block Size'
  - '碎片'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

比较尾块内部碎片、页表元数据、分配频率和 kernel 访问效率。

**可以这样答：**

> Block 较大时页表和分配操作少，连续访问更友好，但每个序列最后一个未填满块会浪费更多显存。Block 较小时内部碎片下降，却增加块管理、页表读取和 kernel 复杂度。最优值与长度分布、并发和注意力 kernel 实现有关。应使用真实请求测有效 KV 利用率、调度开销和 TPOT，不能只看理论碎片。

## 常见追问

1. **长序列是不是适合大 Block？** 通常尾块浪费占比更小，但随机抢占和共享前缀需求仍可能影响选择。
2. **不同请求能共享一个 Block 吗？** 普通尾块不应混放导致生命周期耦合，共享前缀块则可用引用计数安全复用。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
