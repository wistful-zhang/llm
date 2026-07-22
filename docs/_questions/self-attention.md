---
title: "Self-Attention 为什么要除以 √dₖ？"
source: "经典高频题；技术依据：Attention Is All You Need"
verified: true
category: "LLM 基础"
difficulty: "中等"
study_tier: "core"
tags: [Transformer, Attention]
review_status: 已掌握
published: true
answer_status: complete
date: 2026-07-10
---

## 面试时怎么答

从方差推导最扎实：若 Q、K 各维近似独立且方差相近，点积相加 d_k 项后方差随 d_k 增长，数值尺度约为根号 d_k。除掉它能让 Softmax 的输入尺度在不同头维下更稳定。

继续追问时可以说明不缩放会让 Softmax 过早饱和、梯度变小；这是基于近似假设的尺度校正，不代表注意力值必然服从某种精确分布。

**可以这样答：**

> Self-Attention 的分数是 Q 与 K 的点积。若每一维近似独立、均值为零且方差相当，d_k 个乘积相加后，点积分数的方差约随 d_k 增长，标准差约为根号 d_k。头维越大，未经缩放的 Logits 就越容易把 Softmax 推到饱和区，导致分布过尖和梯度变弱。因此除以根号 d_k，用来保持不同维度下相近的数值尺度。

## 核心回答

当 Query 和 Key 的维度较大时，它们点积的方差会随维度增大。点积结果过大会让 Softmax 进入饱和区，使概率分布过于尖锐、梯度变小。除以 $$\sqrt{d_k}$$ 可以把点积的尺度稳定在相对合适的范围，让训练更稳定。

## 展开说明

假设 Query 和 Key 的每个分量相互独立、均值为 0、方差为 1，那么它们点积的方差约为 $$d_k$$，标准差约为 $$\sqrt{d_k}$$。因此进行缩放后，输入 Softmax 的数值尺度不会随着维度线性变大。

这也是它被称为 **Scaled Dot-Product Attention** 的原因：

$$
\operatorname{Attention}(Q,K,V)
= \operatorname{softmax}\!\left(
  \frac{QK^\top}{\sqrt{d_k}}
\right)V
$$

## 工程实践

混合精度训练时仍要关注 Attention Logits、Softmax 和 Mask 的数值稳定性。缩放解决的是维度带来的典型方差增长，并不能替代稳定的实现、合理初始化和异常值监控。

## 常见追问

1. **如果不缩放，训练过程中会出现什么现象？** 随 $$d_k$$ 增大，点积 Logit 方差变大，Softmax 更容易饱和为极尖分布，非最大项梯度变小，训练会更不稳定。
2. **为什么除以 $$\sqrt{d_k}$$，而不是 $$d_k$$？** 独立单位方差分量的点积方差约为 $$d_k$$，标准差是 $$\sqrt{d_k}$$；除以标准差才能把尺度恢复到常数量级。
3. **Additive Attention 是否有同样的问题？** 它先经可学习加性网络和非线性产生分数，不是直接累加 $$d_k$$ 个乘积，因此没有同样的点积方差推导，但仍需控制初始化和输出尺度。

## 一句话复习

> 缩放是为了抵消点积方差随维度增大的影响，避免 Softmax 饱和。

## 参考资料

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
