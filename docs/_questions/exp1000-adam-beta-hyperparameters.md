---
title: 'Adam 的 β₁、β₂ 调大或调小，会怎样改变大模型训练？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练与对齐'
difficulty: '困难'
tags:
  - 'Adam'
  - 'Beta'
  - '超参数'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

分别说明梯度方向平滑和平方梯度时间窗口，再联系噪声与突变响应。

**可以这样答：**

> β₁ 大会让方向动量更平滑但响应新梯度更慢，过小则更新噪声更大。β₂ 大会用更长窗口估计梯度尺度，稳定但可能对 Loss Spike 或分布切换反应迟缓。最优值与 Batch、数据顺序和学习率耦合，修改后不能只看训练 Loss，还要看更新范数和恢复速度。

## 常见追问

1. **β₂ 很大为什么早期更依赖 Bias Correction？** 长时间窗口让零初始化偏差衰减更慢，1-β₂^t 在更多 Step 内明显小于 1。
2. **降低 β₂ 能解决 Spike 吗？** 可能更快适应新尺度，但也会增加分母噪声，不是通用修复。

## 延伸阅读

- [Hugging Face TRL 文档](https://huggingface.co/docs/trl/index)
