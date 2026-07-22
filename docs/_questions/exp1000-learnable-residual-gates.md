---
title: '给每个 Transformer 分支加可学习 Residual Gate 有什么作用？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'Residual Gate'
  - '训练稳定性'
  - '模型结构'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 Gate 调节各层写入强度，并比较标量、逐通道和输入依赖形式。

**可以这样答：**

> Residual Gate 控制 Attention 或 FFN 输出写回残差流的强度，让模型自行调整不同层的贡献。初始设小值可让深网络接近恒等映射，提高训练早期稳定性。标量 Gate 成本低，逐通道或输入依赖 Gate 更灵活，但也可能饱和、增加参数并让解释更复杂。

## 常见追问

1. **Gate 初始为零会阻断上游梯度吗？** 分支内部参数初始梯度可能很小，但 Gate 本身先更新，之后分支逐步获得梯度。
2. **Gate 能用于结构化剪枝吗？** 可以把长期接近零的层作为候选，但仍需消融验证而不能只看系数。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
