---
title: 'Position Interpolation 扩展上下文长度的核心思路是什么？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '位置插值'
  - '长上下文'
  - 'RoPE'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

用“把更长的新坐标压回旧训练区间”解释，再指出分辨率下降。

**可以这样答：**

> Position Interpolation 把长度扩展后的坐标按比例压缩，使模型看到的位置相位仍落在原训练范围内。这样比直接外推到未见过的高频相位更稳定，通常只需少量长上下文继续训练。代价是相邻 Token 的位置差被压小，局部分辨率下降，短文本能力也可能受到影响。

## 常见追问

1. **扩展倍数越大越好吗？** 不是，倍数越大位置压缩越强，远距离可用性和局部分辨率更难兼顾。
2. **为什么还需要长文本微调？** 模型要适应新的相位分布和真正使用远距离信息，单改公式不保证能力出现。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
