---
title: 'Dilated Attention 如何扩大感受野，它会漏掉什么信息？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'Dilated Attention'
  - 'Sparse Attention'
  - '长上下文'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

类比空洞卷积解释固定步长采样，并强调局部窗口与多尺度组合。

**可以这样答：**

> Dilated Attention 按间隔选择历史位置，用较少连接覆盖更远距离，类似空洞卷积扩大感受野。单一间隔会跳过大量邻近细节，也可能形成周期性盲点。实际通常把局部密集窗口、不同膨胀率或跨层交错组合起来，让近距离细节与远距离传播同时存在。

## 常见追问

1. **膨胀率固定有什么风险？** 某些相对距离长期不直接连接，信息只能绕更多层传播。
2. **它适合所有 Head 共用同一模式吗？** 不一定，不同 Head 使用局部和不同尺度模式通常更有表达力。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
