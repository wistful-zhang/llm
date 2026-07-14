---
title: "MoE 如何路由 token，并解决专家负载不均？"
source: "公开真实面试问题汇总中的 MoE 高频题；答案依据 Switch Transformer 论文原创整理"
review_status: "待复习"
category: "LLM 基础"
difficulty: "困难"
tags:
  - MoE
  - Router
  - 负载均衡
published: true
verified: true
date: 2026-07-13
---

## 核心回答

稀疏 MoE 通常把 Transformer 中的部分 FFN 替换成多个专家。Router 根据每个 token 的表示计算专家分数，只激活 Top-1 或 Top-k 专家，再按路由权重合并输出。这样总参数量可以大幅增加，而每个 token 只经过少数专家，计算量不会随专家总数线性增长。主要难点是热门专家过载、冷门专家学不到数据，以及跨设备 All-to-All 通信；常用负载均衡辅助损失、容量限制和路由正则来缓解。

## 展开说明

Router 本质上是一个可学习分类器，但其目标不只是选“最合适”专家，还要让系统可训练、可执行。若大量 token 都去同一个专家，该专家超过容量后可能丢弃、绕过或延迟处理 token，同时其他专家闲置。辅助损失通常鼓励路由概率和实际 token 分配更均匀，但权重过大又可能牺牲专业化。

MoE 的“稀疏”主要发生在专家 FFN，Attention 等模块仍可能是稠密计算。总参数增大也会增加权重存储、检查点和通信成本，因此“相同 FLOPs 下更多参数”不等于部署成本不变。

## 工程实践

训练时应监控每个专家的 token 数、容量溢出率、路由熵、负载变异系数和通信时间，并按数据领域切片检查是否出现专家塌缩。专家并行的布局要结合网络拓扑设计；如果 All-to-All 成为瓶颈，理论上的稀疏计算优势可能无法转化成端到端吞吐。

## 常见追问

1. Top-1 与 Top-2 路由在质量、计算和容错上有什么差异？
2. 负载均衡损失过强会带来什么问题？
3. 为什么 MoE 参数量很大，单 token FLOPs 却可以接近较小的稠密模型？

## 一句话复习

> MoE 用 Router 为每个 token 稀疏选择专家，以更多总参数换取有限激活计算，但必须治理负载和通信。

## 参考资料

- 面试主题：[Datawhale 的 LLM、VLM 与 Agent 面试问题总结](https://github.com/datawhalechina/hello-agents/blob/main/Extra-Chapter/Extra01-%E9%9D%A2%E8%AF%95%E9%97%AE%E9%A2%98%E6%80%BB%E7%BB%93.md)
- 技术依据：[Switch Transformers](https://arxiv.org/abs/2101.03961)
