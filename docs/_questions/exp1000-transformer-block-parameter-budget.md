---
title: '给定 d_model 和层数，怎样快速判断参数主要花在 Attention 还是 FFN？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - '参数量'
  - 'Attention'
  - 'FFN'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

给出标准 MHA 约 4d²、普通 FFN 约 2d·d_ff 的数量级，再说明门控结构。

**可以这样答：**

> 标准 MHA 的 Q、K、V、O 四个方阵约为 4d²，忽略 Bias 即可快速估算。普通 FFN 两个矩阵约为 2d·d_ff，若 d_ff=4d 就约为 8d²，通常比 Attention 多。门控 FFN 有三组矩阵，常缩小 d_ff 保持预算；GQA 只减少 K、V 投影，不能把 Attention 全部按 KV Head 比例缩小。

## 常见追问

1. **词表参数什么时候不可忽略？** 词表很大、模型较窄或输入输出不共享权重时，Embedding 与 LM Head 占比会明显上升。
2. **序列长度会改变参数量吗？** 不会，但会改变激活、Attention 计算量和缓存成本。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
