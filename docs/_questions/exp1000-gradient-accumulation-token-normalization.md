---
title: 'Gradient Accumulation 中各 Microbatch 有效 Token 数不同，Loss 应怎样归一化？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '困难'
tags:
  - 'Gradient Accumulation'
  - 'Token Normalization'
  - 'Microbatch'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明不能简单平均每个 Microbatch 的均值，要按整个累积窗口总有效 Token 加权。

**可以这样答：**

> 若每个 Microbatch 先按自身 Token 平均再等权累加，Token 少的 Microbatch 单 Token 权重更高。正确的全 Token 平均应累加 Loss Sum，并除以整个累积窗口及所有 Rank 的有效 Token 总数。实现可预先知道总数或对梯度按 Token 比例缩放，还要与 DDP 默认平均因子一致。

## 常见追问

1. **每个 Microbatch 长度固定就没问题吗？** 还要看 Padding 和回答 Mask，有效 Loss Token 仍可能不同。
2. **最后不足一个累积窗口怎么办？** 按实际 Microbatch 和 Token 数重新归一化，不能沿用完整窗口除数。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
