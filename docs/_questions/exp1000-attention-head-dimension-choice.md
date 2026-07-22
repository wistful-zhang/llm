---
title: '注意力 Head Dimension 过大或过小分别会有什么问题？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'Attention'
  - 'Head Dimension'
  - '架构设计'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从单头表示容量、头数量、点积统计和硬件效率四个角度权衡。

**可以这样答：**

> Head Dimension 太小会限制单个 Head 表达复杂匹配关系的能力，也可能让每头信息过于碎片化。维度太大则在固定 d_model 下减少 Head 数，使并行关注不同关系的机会变少，并增加单头 QK 计算。工程上还要考虑 Tensor Core 友好的对齐尺寸，所以常选择 64、128 等便于高效计算的维度。

## 常见追问

1. **Head 数越多一定越好吗？** 不一定，很多 Head 会冗余，而且每头维度过小会损害质量和算子效率。
2. **改变 Head Dimension 后缩放因子怎么变？** 点积通常除以 √d_head，以保持 Logit 方差处于适合 Softmax 的范围。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
