---
title: '多头注意力拼接后为什么还需要输出投影 W_O？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'Attention'
  - '多头注意力'
  - '线性层'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

回答维度对齐只是表层作用，重点说明跨头混合和写回残差流。

**可以这样答：**

> 各个 Head 的输出拼接后只是并列特征，W_O 会把它们重新混合并映射回 Residual Stream 的维度。它让一个输出通道能够组合多个 Head 的信息，而不是让各头永久隔离。W_O 还控制注意力子层向残差流写入什么方向，因此删掉它会明显限制多头协作能力。

## 常见追问

1. **W_O 能否按 Head 分组而不混合？** 可以做结构化约束，但会减少跨头组合，通常需要用其他层补回表达能力。
2. **Head 剪枝为什么常要连同 W_O 分块处理？** 某个 Head 的输出对应 W_O 的一组输入列，只删 QKV 而不处理映射会造成维度和语义不一致。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
