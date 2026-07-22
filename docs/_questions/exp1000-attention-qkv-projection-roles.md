---
title: '注意力中的 Q、K、V 三个投影分别学什么，为什么不能只用一份表示？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Attention'
  - 'QKV'
  - 'Transformer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

用“查询条件、可匹配索引、被汇聚内容”解释三者，再说明独立投影带来的表达能力。

**可以这样答：**

> Q 表示当前位置想找什么，K 表示各位置可被什么查询匹配，V 则是匹配后真正汇聚的内容。独立投影允许匹配空间与内容空间分工，同一 Token 可以用一种特征参与寻址、用另一种特征传递信息。若完全共用表示，模型仍能工作，但会强迫相似度判断和内容编码共享约束，表达能力更受限。

## 常见追问

1. **Q 和 K 的维度必须等于 V 吗？** 不必须，Q 与 K 的点积维度要一致，V 和最终输出维度可以通过投影调整。
2. **自注意力里 Q、K、V 的输入是否相同？** 通常来自同一层输入，但经过不同权重矩阵后承担不同角色。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
