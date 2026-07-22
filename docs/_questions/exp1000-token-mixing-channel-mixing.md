---
title: '怎样从 Token Mixing 和 Channel Mixing 两个视角理解 Transformer Block？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '简单'
study_tier: 'extended'
tags:
  - 'Token Mixing'
  - 'Channel Mixing'
  - 'Transformer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把 Attention 对序列维的交互和 FFN 对隐藏维的变换清晰分开。

**可以这样答：**

> Attention 让每个位置汇聚其他位置的信息，主要承担 Token Mixing。FFN 在每个位置独立应用相同网络，主要在隐藏通道之间做 Channel Mixing。二者交替后，跨位置取得的信息能在通道中重组，再被下一层传播；这个视角也方便比较卷积、MLP-Mixer 和 SSM 等替代模块。

## 常见追问

1. **FFN 完全不混合 Token 吗？** 标准逐位置 FFN 不直接混合，但它处理的输入已经包含 Attention 汇聚的跨 Token 信息。
2. **Attention 是否也混合 Channel？** QKV 和 W_O 投影会混合通道，只是其独特作用是数据依赖的 Token 交互。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
