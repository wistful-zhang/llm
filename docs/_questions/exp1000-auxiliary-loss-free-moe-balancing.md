---
title: 'Auxiliary-Loss-Free 的 MoE 负载均衡是怎样做到的？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'MoE'
  - '负载均衡'
  - 'Router Bias'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明用动态 Bias 影响选路，而主路由概率仍用于输出权重。

**可以这样答：**

> 一种做法是为每个 Expert 维护动态路由 Bias，根据近期负载偏高或偏低进行反向调整。选择 Expert 时加入该 Bias，引导 Token 分布更均匀，但计算专家输出权重时仍使用原始路由分数。这样避免辅助损失直接干扰语言模型目标，不过 Bias 更新速度和负载统计窗口需要仔细调节。

## 常见追问

1. **为什么辅助均衡损失可能伤害质量？** 它会把均匀分配压力反向传播进表示和 Router，可能压制本来有用的专家专业化。
2. **动态 Bias 会不会振荡？** 会，更新过快或批次统计噪声大时可能在专家间来回过度补偿。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
