---
title: '向量索引用 Product Quantization 压缩后，召回下降主要来自哪里？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'RAG'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'PQ'
  - '向量压缩'
  - 'Recall'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明子空间编码和距离近似误差，并给出重排原向量与训练码本的补救。

**可以这样答：**

> PQ 把向量分成多个子空间，用码本中心的编号代替原始浮点值，因此距离计算存在量化误差。码本训练数据不代表线上分布、子空间切分不合适或码字过少都会扩大误差。常见做法是用 PQ 做大规模候选召回，再对较小候选集用原始向量或更高精度表示重排。评估应特别看临界相似样本和领域切片，不能只看平均 Recall。

## 常见追问

1. **OPQ 有什么作用？** 它先学习旋转以更好地分配各维信息，再做 PQ，常能降低子空间量化误差。
2. **原始向量必须全部保留吗？** 不一定，可只为热数据或候选重排存储较高精度副本，按成本取舍。

## 延伸阅读

- [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)
