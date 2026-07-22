---
title: '什么时候会选择不共享 Input Embedding 和 LM Head 权重？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'Embedding'
  - 'LM Head'
  - 'Weight Tying'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明输入语义空间与输出分类器需求不完全相同，并权衡参数成本。

**可以这样答：**

> 共享权重能减少大词表参数，并让输入与输出词表示相互约束。若输入编码与输出判别需要不同几何结构，或模型采用非对称词表、特殊初始化，不共享可能提供更高自由度。代价是词表矩阵参数和显存近似翻倍，还可能失去共享带来的正则化。

## 常见追问

1. **不共享一定提升质量吗？** 不一定，收益依赖模型大小和数据，额外参数也可能只是冗余。
2. **共享时 LM Head 还可以有独立 Bias 吗？** 可以，权重绑定不妨碍单独设置输出 Bias，但很多 LLM 也会省略它。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
