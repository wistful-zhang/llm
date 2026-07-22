---
title: 'Residual Stream 的宽度为什么会成为整个模型的信息瓶颈？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'Residual Stream'
  - 'd_model'
  - '信息瓶颈'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明所有子层读写都要经过 d_model 维通道，即使 FFN 临时扩维也会压回。

**可以这样答：**

> 每层 Attention 和 FFN 最终都把结果写回 d_model 维的 Residual Stream，跨层持续保留的信息必须经过这个通道。FFN 即使扩到更宽的中间层，也会在离开本层前压回 d_model。增大残差宽度能提高共享表示容量，但会让几乎所有投影矩阵、激活和通信成本上升。

## 常见追问

1. **增加 FFN 宽度能完全弥补小 d_model 吗？** 不能，FFN 提高本层计算容量，但跨层状态仍被压回较窄的残差流。
2. **多头数会改变 Residual Stream 宽度吗？** 通常不会，各头拼接后仍由 W_O 映射回固定 d_model。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
