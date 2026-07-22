---
title: 'Global Batch 变大后，学习率为什么不能机械按线性规则放大？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练与对齐'
difficulty: '困难'
tags:
  - 'Batch Size'
  - '学习率'
  - 'Scaling Rule'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明梯度方差下降只在临界 Batch 前明显，并区分 SGD 与 Adam。

**可以这样答：**

> 小 Batch 区域增大 Batch 会降低梯度噪声，线性或平方根缩放可保持一定更新统计。超过 Critical Batch 后新增样本高度冗余，方差收益饱和，继续放大学习率容易越过稳定边界。Adam 的自适应分母、Warmup 和总训练 Token 也会改变规则，所以应通过小规模 Sweep 和梯度噪声指标确定。

## 常见追问

1. **Batch 变大但 LR 不变会怎样？** 单步更稳定但每 Token 更新次数减少，可能收敛更慢或需要更多 Token。
2. **Gradient Accumulation 与真实大 Batch 等价吗？** 在参数不更新、随机层和归一化处理一致时近似等价，数值顺序与通信仍有差异。

## 延伸阅读

- [Hugging Face TRL 文档](https://huggingface.co/docs/trl/index)
