---
title: 'Transformer-XL 的 Segment Recurrence 解决了普通分段训练的什么问题？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'Transformer-XL'
  - 'Segment Recurrence'
  - '长上下文'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明缓存上段隐藏状态形成跨段上下文，同时梯度通常不跨缓存反传。

**可以这样答：**

> 普通分段会在边界切断上下文，同一文档跨段依赖无法建模。Transformer-XL 把上一段各层隐藏状态缓存为当前段的额外记忆，使注意力能读取更早内容。缓存通常 Stop-Gradient，因此扩大了前向感受野但没有让反向图无限增长，并需要相对位置编码避免位置歧义。

## 常见追问

1. **缓存为什么不反传梯度？** 否则计算图会跨很多段持续增长，显存和训练成本失控。
2. **它与推理 KV Cache 相同吗？** 思想相近但缓存对象和训练用途不同，Transformer-XL 缓存每层隐藏状态用于分段训练。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
