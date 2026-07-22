---
title: 'Attention Mask 为什么要在 Softmax 前加大负数，不能在分数上直接乘零？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '简单'
tags:
  - 'Attention Mask'
  - 'Softmax'
  - '数值稳定性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

用 Softmax 归一化后的概率是否为零来判断两种做法。

**可以这样答：**

> 把被屏蔽位置的 Logit 乘零只会让它变成 0，而 0 经过 Softmax 仍会得到正概率。加上负无穷或足够大的负数，指数后才近似为 0，并让其余可见位置重新归一化。实现还要针对数据类型选安全的最小值，避免全 Mask 行产生 NaN。

## 常见追问

1. **为什么全 Mask 行会出现 NaN？** 所有 Logit 都是负无穷时，Softmax 的最大值平移和归一化会遇到未定义的 0/0。
2. **Softmax 后再乘 Mask 可以吗？** 还必须重新归一化，否则剩余权重和不为 1，并且已浪费被屏蔽位置的计算。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
