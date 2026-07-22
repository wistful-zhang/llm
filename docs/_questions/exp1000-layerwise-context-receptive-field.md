---
title: '使用局部 Attention 时，模型的有效感受野怎样随层数增长？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Local Attention'
  - '感受野'
  - '长上下文'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

区分理论可达范围与实际信号能否稳定传递，再说明全局连接如何缩短路径。

**可以这样答：**

> 若每层只能看前方 w 个 Token，堆叠 L 层后理论上最远可通过多跳传播约 Lw 的距离。这个范围只是连接图上的可达性，远处信息需经过多次混合，可能衰减或被覆盖。加入全局层、扩大部分窗口或使用跨层不同模式，可以缩短传播路径并改善有效感受野。

## 常见追问

1. **为什么理论感受野不等于有效上下文？** 信息虽可到达，但路径长、注意力分散和训练数据不足都可能让模型不会使用它。
2. **每层窗口都相同最简单，为什么还要变化？** 不同窗口或偏移能覆盖边界盲区，并用少量大窗口层建立远程连接。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
