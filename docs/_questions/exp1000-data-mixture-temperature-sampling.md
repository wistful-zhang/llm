---
title: '多领域预训练中 Temperature Sampling 怎样改变 Data Mix？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Data Mix'
  - 'Temperature Sampling'
  - '采样'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

用 p_i∝n_i^α 解释 α 小于 1 时上采样小域，并说清重复风险。

**可以这样答：**

> 若领域 i 的原始规模为 n_i，可用 p_i∝n_i^α 生成采样概率。α=1 接近按原始规模采样，α<1 会压平分布、提高小领域占比，α趋近 0 时更接近均匀。小域被上采样后更容易重复和过拟合，因此要联合考虑质量、有效 Token、训练轮数和验证曲线。

## 常见追问

1. **α 可以对所有领域统一吗？** 可以作为简单基线，但语言、代码和高质量小域往往需要单独约束。
2. **上采样会创造新信息吗？** 不会，只改变训练看到的频次，重复过多会出现收益递减和记忆风险。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
