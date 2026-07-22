---
title: '同样训练 FLOPs 下，MoE 为什么能拥有比 Dense 模型更多参数？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'MoE'
  - 'Sparse Model'
  - '计算量'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

区分总参数和每个 Token 激活参数，顺带说明通信与内存不是免费的。

**可以这样答：**

> MoE 为每层准备多个 Expert，但每个 Token 只路由到少数几个，因此每 Token 激活参数和计算量远小于总参数量。模型可以增加专家总容量而不按同一比例增加前向 FLOPs。权重仍要存储和分布，路由还引入 All-to-All 通信与负载不均，所以总参数多不代表部署成本等同于小 Dense 模型。

## 常见追问

1. **MoE 的显存会比等 FLOPs Dense 模型小吗？** 未必，所有专家权重都要驻留或分片，总权重显存通常更大。
2. **为什么 MoE 适合扩模型容量？** 它把容量扩张和单 Token 计算部分解耦，让不同 Token 使用不同参数子集。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
