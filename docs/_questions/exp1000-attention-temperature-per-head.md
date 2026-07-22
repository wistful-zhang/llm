---
title: '给每个 Attention Head 单独学习 Temperature 有什么作用和风险？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Attention Temperature'
  - '多头注意力'
  - 'Softmax'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把温度解释为每头注意力尖锐度，并指出尺度不可辨识和饱和。

**可以这样答：**

> 不同 Head 可能需要不同范围，有的聚焦单个位置，有的做广泛汇聚，独立 Temperature 可调节各自 Softmax 尖锐度。它提高灵活性，也可能与 Q、K 范数形成可替代的尺度自由度，使参数持续放大。通常要配合 QK-Norm、正参数化或范围约束，防止温度趋向极端。

## 常见追问

1. **温度越低注意力越尖吗？** 若按 Logit 除以 T 定义，T 越低分布越尖；若直接乘尺度则方向相反。
2. **如何监控温度异常？** 联合查看每头温度、QK 范数、注意力熵和梯度，而不是只看一个参数。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
