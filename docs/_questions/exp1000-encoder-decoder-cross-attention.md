---
title: 'Encoder-Decoder 的 Cross-Attention 中 Q、K、V 分别来自哪里？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '简单'
tags:
  - 'Cross-Attention'
  - 'Encoder-Decoder'
  - 'Transformer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

明确数据来源，再说明为什么解码端能按当前生成状态读取源序列。

**可以这样答：**

> Cross-Attention 的 Q 来自 Decoder 当前层，K 和 V 来自 Encoder 对输入序列的表示。这样 Decoder 的每个位置都能根据当前生成上下文，动态选择源序列中的相关信息。Encoder 输出对整个解码过程通常不变，所以其 K、V 可以预先计算并重复使用。

## 常见追问

1. **Cross-Attention 通常需要因果 Mask 吗？** 源序列一般全部可见，不需要因果 Mask，但仍要屏蔽源侧 Padding。
2. **为什么翻译模型不只把源文本拼到 Decoder 前面？** 拼接也可行，但 Cross-Attention 把源编码与目标生成分开，控制和缓存更清晰。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
