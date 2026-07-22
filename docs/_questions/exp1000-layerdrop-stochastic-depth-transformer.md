---
title: 'Transformer 中的 LayerDrop 如何训练，为什么推理时可以删层？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'LayerDrop'
  - 'Stochastic Depth'
  - '模型压缩'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明训练时随机跳过完整残差分支，使不同深度子网络都被训练。

**可以这样答：**

> LayerDrop 在训练时按概率跳过某些完整层或残差分支，让模型经历多种有效深度。因为残差路径仍保持表示贯通，被保留层学会在缺少邻层时继续工作。推理时可以选择较浅子网络换速度，但删层比例过高会造成分布偏移，通常需要按验证集选择或再微调。

## 常见追问

1. **它与普通 Dropout 有何不同？** 普通 Dropout 丢单个激活，LayerDrop 丢整个结构单元。
2. **所有层用同一丢弃率合理吗？** 不一定，底层和高层作用不同，可按深度设置不同保留概率。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
