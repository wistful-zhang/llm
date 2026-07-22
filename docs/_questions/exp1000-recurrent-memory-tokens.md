---
title: 'Recurrent Memory Token 如何让模型跨段保留信息，它的瓶颈在哪里？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'Memory Token'
  - '长上下文'
  - 'Transformer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

解释少量记忆 Token 在段间传递的压缩通道，以及容量和训练信用分配。

**可以这样答：**

> 模型在每个文本段中加入少量 Memory Token，让它们读取本段并把更新后的表示传给下一段。这样跨段状态大小固定，不必缓存全部历史 Token。瓶颈是大量历史被压缩进少数向量，细节可能丢失，而且跨很多段学习该保留什么会面临较长的信用分配路径。

## 常见追问

1. **增加 Memory Token 数量有什么代价？** 容量更大，但每段注意力计算和状态存储也增加。
2. **它能替代外部检索吗？** 不能完全替代，外部检索可保存和随机访问原始信息，记忆 Token 是有损内部状态。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
