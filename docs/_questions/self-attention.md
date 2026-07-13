---
title: "Self-Attention 为什么要除以 √dₖ？"
source: "经典高频题；技术依据：Attention Is All You Need"
category: "LLM 基础"
difficulty: "中等"
tags: [Transformer, Attention]
review_status: 已掌握
published: true
date: 2026-07-10
---

## 核心回答

当 Query 和 Key 的维度较大时，它们点积的方差会随维度增大。点积结果过大会让 Softmax 进入饱和区，使概率分布过于尖锐、梯度变小。除以 `√dₖ` 可以把点积的尺度稳定在相对合适的范围，让训练更稳定。

## 展开说明

假设 Query 和 Key 的每个分量相互独立、均值为 0、方差为 1，那么它们点积的方差约为 `dₖ`，标准差约为 `√dₖ`。因此进行缩放后，输入 Softmax 的数值尺度不会随着维度线性变大。

这也是它被称为 **Scaled Dot-Product Attention** 的原因：

```text
Attention(Q, K, V) = softmax(QKᵀ / √dₖ)V
```

## 工程实践

混合精度训练时仍要关注 Attention Logits、Softmax 和 Mask 的数值稳定性。缩放解决的是维度带来的典型方差增长，并不能替代稳定的实现、合理初始化和异常值监控。

## 常见追问

1. 如果不缩放，训练过程中会出现什么现象？
2. 为什么除以 `√dₖ`，而不是 `dₖ`？
3. Additive Attention 是否有同样的问题？

## 一句话复习

> 缩放是为了抵消点积方差随维度增大的影响，避免 Softmax 饱和。

## 参考资料

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
