---
title: '为什么说 Attention 的 QK 负责“读哪里”，V 和 W_O 负责“写什么”？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Attention'
  - 'QK'
  - 'Value'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

用注意力权重与最终写入向量的分工解释，并指出二者共同训练。

**可以这样答：**

> QK 点积经 Softmax 产生位置权重，决定每个 Query 从哪些历史位置读取。V 把被读取位置转换成可传递内容，W_O 再把多头结果映射成写入 Residual Stream 的方向。即使关注同一位置，不同 V 或 W_O 也能写入完全不同的信息，所以注意力图不能单独代表模型输出。

## 常见追问

1. **QK 不包含内容写入信息吗？** 它们来自同一隐藏状态并参与联合训练，但在计算角色上主要决定权重。
2. **替换 V 而保持注意力权重会怎样？** 读取位置不变，但汇聚内容改变，可用于区分寻址和内容通路的因果作用。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
