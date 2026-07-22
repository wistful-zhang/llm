---
title: 'QK-Norm 为什么能缓解注意力 Logit 失控，它可能带来什么代价？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'QK-Norm'
  - 'Attention'
  - '训练稳定性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明归一化限制向量范数，而匹配仍由方向和可学习尺度决定。

**可以这样答：**

> QK-Norm 在点积前归一化 Query 和 Key，使 Logit 不再因向量范数持续变大而失控。相似度主要由方向决定，再通过固定或可学习温度控制 Softmax 尖锐程度。它常提高大规模训练稳定性，但也限制了模型用向量模长表达置信度的自由，需要合适的尺度参数补偿。

## 常见追问

1. **QK-Norm 后还要除以 √d 吗？** 取决于归一化定义和温度设计，二者同时使用时要避免重复把 Logit 压得过小。
2. **它能完全消除 Attention Entropy Collapse 吗？** 不能，数据、学习率和温度仍可能让注意力过尖，只是范数这一条路径被约束了。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
