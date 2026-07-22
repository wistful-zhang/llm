---
title: '连接视觉编码器和 LLM 时，线性层、MLP 与 Resampler 怎么选？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '多模态'
difficulty: '困难'
tags:
  - 'Projector'
  - 'Resampler'
  - '视觉 Token'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

比较通道对齐能力、Token 压缩能力和训练复杂度，避免只看参数量。

**可以这样答：**

> 线性层成本最低，适合视觉特征与语言空间较容易对齐的基线。MLP 增加非线性容量，通常仍保持原视觉 Token 数。Resampler 用可学习查询或注意力把可变长视觉特征压成较少 Token，能降低 LLM 计算，但过度压缩会损失小目标和文字细节。选择应比较同等延迟下的任务质量，并根据分辨率和下游任务调整输出 Token 数。

## 常见追问

1. **Projector 越深越好吗？** 不是，过深会增加优化难度，也可能让有限配对数据过拟合。
2. **Resampler 输出固定 Token 有什么缺点？** 复杂图片和简单图片获得相同容量，难以兼顾动态信息密度。

## 延伸阅读

- [CLIP](https://arxiv.org/abs/2103.00020)
