---
title: 'Token 频率极不均衡时，Embedding 学习会出现什么问题？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练与对齐'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Embedding'
  - 'Token Frequency'
  - '长尾'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明高频行更新多、稀有行估计噪声大，并联系词表设计和数据采样。

**可以这样答：**

> 高频 Token 的 Embedding 在大量上下文中更新，统计稳定；长尾 Token 只得到少数梯度，容易欠训练或记住偶然样本。大词表会加剧这种差异，尤其是只出现几次的长片段。可通过更合理的词表裁剪、数据覆盖和初始化改善，但对语言模型目标随意重加权也可能扭曲真实概率。

## 常见追问

1. **稀有 Token 的梯度一定小吗？** 出现次数少但单次梯度未必小，问题主要是估计方差高和覆盖不足。
2. **输出层的稀有 Token 也会更新吗？** 全 Softmax 中所有行都受负类梯度影响，但正例信号仍非常稀少。

## 延伸阅读

- [Hugging Face TRL 文档](https://huggingface.co/docs/trl/index)
