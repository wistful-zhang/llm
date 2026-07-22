---
title: 'Sliding-Window Attention 在窗口边界会产生什么问题？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'Sliding Window'
  - '边界效应'
  - '长上下文'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明刚滑出窗口的信息突然不可见，以及多层传播和全局 Token 的缓解方式。

**可以这样答：**

> 当 Token 刚好滑出窗口后，后续位置会从直接可见变成完全不可见，形成不连续的边界效应。多层局部传播能让部分信息以压缩形式继续向前，但原始细节和精确引用可能丢失。保留 Attention Sink、周期性全局层或摘要记忆可以缓解，但都会增加状态或计算。

## 常见追问

1. **增大窗口是唯一办法吗？** 不是，还可使用稀疏全局连接、压缩记忆或检索补充远距离信息。
2. **边界问题在训练时如何暴露？** 要让关键依赖分布在不同相对距离，并按距离分桶评测，而非只测平均 Loss。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
