---
title: 'Sandwich Norm 在 Transformer 子层前后都归一化，有什么动机？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Sandwich Norm'
  - 'Normalization'
  - '训练稳定性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把输入稳定和输出增量受控分别对应到前、后两个 Norm。

**可以这样答：**

> 子层前的 Norm 稳定其输入分布和梯度路径，子层后的额外 Norm 则限制写回残差流的增量尺度。Sandwich Norm 试图同时获得 Pre-Norm 易优化和更强输出控制的好处。它增加算子成本，也可能过度消除幅度信息，因此是否有效依赖模型规模、残差缩放和训练精度。

## 常见追问

1. **后一个 Norm 放在残差相加前还是后？** 常见 Sandwich 形式是在子层输出后、残差相加前归一化，但具体论文定义要核对。
2. **为什么 Norm 增多会影响速度？** Norm 是额外的内存读写和归约操作，小批量时未必能被矩阵计算掩盖。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
