---
title: 'AdamW 中哪些参数通常不做 Weight Decay，依据是什么？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练与对齐'
difficulty: '中等'
tags:
  - 'AdamW'
  - 'Weight Decay'
  - '参数分组'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 Norm Scale、Bias 和某些标量参数缺少矩阵权重同样的正则化含义。

**可以这样答：**

> 常见做法对矩阵权重衰减，而排除 Bias、Norm 的 Scale 与 Shift，以及可学习温度等少量标量。后者直接控制偏移或尺度，向零拉可能破坏归一化和校准，并且参数量很小，不是过拟合主体。排除规则不是定理，应按参数角色明确分组并记录，避免名称匹配漏掉自定义模块。

## 常见追问

1. **Embedding 要不要衰减？** 不同配方都有，需结合权重绑定、词频长尾和验证结果决定。
2. **为什么不能只用 ndim=1 自动排除？** 有些一维参数值得衰减，某些二维特殊参数又可能不该衰减，角色比形状更可靠。

## 延伸阅读

- [Hugging Face TRL 文档](https://huggingface.co/docs/trl/index)
