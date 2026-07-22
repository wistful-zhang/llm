---
title: 'Decoder-Only 模型训练时整句都已知，为什么仍然不能看未来 Token？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '简单'
study_tier: 'extended'
tags:
  - '因果语言模型'
  - 'Attention Mask'
  - '训练目标'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把训练时的并行计算和推理时的信息条件对齐讲清楚。

**可以这样答：**

> 训练虽然一次送入整段文本，但位置 t 的目标是预测 t+1，只能条件于它左侧已经出现的 Token。Causal Mask 阻止当前位置读取未来答案，使训练条件与自回归推理一致。若允许偷看未来，损失会很低，但模型在真实生成时拿不到这些信息，学到的能力无法使用。

## 常见追问

1. **加了 Causal Mask 为什么还能并行训练？** 所有位置的矩阵运算仍可一次完成，只是在注意力分数上屏蔽未来位置。
2. **推理时还需要完整三角 Mask 吗？** 增量解码只有一个新查询，KV Cache 中本来就只有过去位置，通常不必构造完整三角矩阵。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
