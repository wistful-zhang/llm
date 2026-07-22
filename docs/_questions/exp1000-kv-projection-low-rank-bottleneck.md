---
title: '对 K、V 投影做低秩瓶颈时，为什么 K 往往比 V 更敏感？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'Key Value'
  - '低秩'
  - 'Attention'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从 K 决定离散式寻址、V 决定内容传递的误差传播差异回答，并保留条件性。

**可以这样答：**

> K 的误差会改变 QK 排序和 Softmax 权重，可能让模型直接关注错误位置，因此小扰动会产生非线性寻址变化。V 的误差通常在既定权重下被线性加权，影响相对平滑。这个结论不是绝对的，任务和层位置会改变敏感度，所以低秩维度应分别消融而不是默认相同。

## 常见追问

1. **为什么压缩 V 仍可能严重掉点？** V 承载实际内容，瓶颈过小会让被正确找到的信息也无法完整传递。
2. **如何评估 K 的压缩损失？** 可比较注意力排序、熵、检索类任务和最终验证损失，而不只看重建误差。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
