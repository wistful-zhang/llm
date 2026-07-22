---
title: '为什么大模型预训练更常用 Adam 系，而不是带 Momentum 的 SGD？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练与对齐'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'SGD'
  - 'Adam'
  - '预训练'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从梯度尺度差异、稀疏词表更新和调参效率解释，同时承认 SGD 状态更省。

**可以这样答：**

> Transformer 不同参数和 Token 的梯度尺度差异大，Adam 的坐标级自适应通常让早期优化更稳、对统一学习率更宽容。词表长尾和非平稳数据也受益于二阶尺度估计。SGD 状态更少且有时泛化好，但达到同等 Loss 往往需要更精细的学习率、归一化和更长训练，规模化成本未必占优。

## 常见追问

1. **Adam 一定泛化更差吗？** 不是，这个结论依赖任务和调参，大模型预训练不能直接套用小型视觉任务经验。
2. **SGD 能省多少状态？** 带 Momentum 通常每参数一份状态，Adam 通常有一阶和二阶两份。

## 延伸阅读

- [Hugging Face TRL 文档](https://huggingface.co/docs/trl/index)
