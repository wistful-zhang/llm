---
title: 'Universal Transformer 为什么在深度方向共享参数？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'Universal Transformer'
  - '参数共享'
  - '模型结构'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把重复应用同一变换解释成迭代计算，并同时说明容量约束。

**可以这样答：**

> Universal Transformer 重复应用同一组层参数，把深度看成对表示进行多步迭代更新。参数共享能在较小模型体积下增加计算步数，也可能对不同长度的推理步数产生泛化。代价是各深度不能自由学习完全不同的功能，优化也更像循环网络，可能需要步数编码或自适应停止机制。

## 常见追问

1. **共享参数会减少 FLOPs 吗？** 不会自动减少，重复多少步仍执行多少次计算，只是权重存储变小。
2. **为什么需要 Step Embedding？** 同一参数在不同迭代步读取 Step 信息后，才能形成随深度变化的行为。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
