---
title: 'Adam 的 Epsilon 放在开方内还是开方外，为什么会影响训练？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练与对齐'
difficulty: '困难'
tags:
  - 'Adam'
  - 'Epsilon'
  - '数值稳定性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

比较 √(v+ε) 与 √v+ε 在 v 很小时的有效下界，强调实现兼容。

**可以这样答：**

> ε 放在开方外时分母下界约为 ε，放在开方内时下界约为 √ε，两者在小 v 区域差异很大。低精度、稀疏梯度和训练早期最容易触发这种差异，实际有效步长因此可能相差多个数量级。复现实验必须同时记录 ε 数值和放置位置，不能只写“使用 AdamW 默认参数”。

## 常见追问

1. **v 很大时还有区别吗？** 当 v 远大于 ε 时两种形式近似相同。
2. **切换框架为什么可能 Loss 突变？** 不同优化器实现的 ε 位置和默认值可能不同，即使其他超参数一致。

## 延伸阅读

- [Hugging Face TRL 文档](https://huggingface.co/docs/trl/index)
