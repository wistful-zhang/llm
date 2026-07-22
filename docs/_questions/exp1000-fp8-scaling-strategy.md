---
title: 'FP8 推理为什么需要 Scale，静态、动态和延迟缩放有什么区别？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
tags:
  - 'FP8'
  - 'Scale'
  - '动态范围'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 FP8 表示范围有限，比较离线固定、当前张量统计和历史 amax 更新。

**可以这样答：**

> FP8 有有限指数和尾数，需要用 scale 把张量范围映射到可表示区间，避免溢出或大量精度浪费。静态缩放来自校准，运行快但对分布变化不敏感；动态缩放根据当前张量统计，更稳健却增加归约开销。延迟缩放使用历史 amax 更新下一步 scale，减少同步但可能跟不上突变。策略要按权重、激活和 KV 分别选择，并监控饱和率与零值比例。

## 常见追问

1. **E4M3 和 E5M2 怎么选？** E4M3 精度更高、范围较小，E5M2 范围更大，常按前向与梯度或不同张量需求选择。
2. **Scale 本身用什么精度？** 通常用较高精度保存和计算，避免 scale 误差再次放大量化损失。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
