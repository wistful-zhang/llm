---
title: 'Attention 与 FFN 采用 Parallel Residual 时，为什么要重新考虑分支缩放？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'Parallel Residual'
  - '残差缩放'
  - '稳定性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明两个相关增量同时相加，串行结构的尺度假设不再直接成立。

**可以这样答：**

> Parallel Residual 让 Attention 和 FFN 同时读取一个输入并把两个增量一起加回。残差流每层接收的方差贡献和相关性因而不同于串行结构，沿用原初始化可能让尺度增长过快。常通过输出初始化、固定系数或可学习 Gate 控制分支，但最优方案要结合 Norm 位置和深度验证。

## 常见追问

1. **直接各乘 0.5 合理吗？** 能降低总幅度但不一定保持方差，若分支近似独立，方差尺度更接近 1/√2。
2. **两个分支真的独立吗？** 不完全独立，它们读取同一输入且共同训练，所以实际相关性需要测量。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
