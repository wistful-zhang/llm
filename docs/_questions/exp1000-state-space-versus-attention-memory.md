---
title: 'State Space Model 与 Attention 在处理历史信息时的根本差别是什么？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'SSM'
  - 'Attention'
  - '长序列'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

对比固定大小递归状态与显式保留历史 Token，再谈随机访问能力。

**可以这样答：**

> SSM 把过去压缩进固定维度状态并递归更新，推理时内存与序列长度可以近似无关。Attention 通常保留历史 K、V，让当前 Token 能直接按内容访问任意过去位置。前者高效但可能在状态压缩中丢细节，后者检索灵活却付出随长度增长的缓存与计算成本。

## 常见追问

1. **SSM 训练为什么还能并行？** 线性递推可以用卷积或并行扫描计算整段序列，而不必逐 Token 串行。
2. **SSM 是否完全不能找回早期细节？** 不是，但信息必须被状态持续保留，没有 Attention 那样显式的随机访问缓存。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
