---
title: '怎样构造长期可用的 Pretraining Validation Set？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Validation Set'
  - '预训练'
  - '数据治理'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

强调冻结版本、分域代表性、去污染和不参与过滤器调参。

**可以这样答：**

> 验证集应覆盖主要语言、领域、长度和质量层级，并以文档簇为单位与训练候选去重。版本一旦用于长期曲线比较就应冻结，新增分布通过新切片扩展而不是重写旧集合。它不能参与 Quality Filter 和 Data Mix 的反复拟合到失去独立性，关键决策还应保留第二套未触碰测试集。

## 常见追问

1. **验证集需要很大吗？** 要大到分域 Loss 方差稳定，但质量、独立性和固定性比盲目扩大更重要。
2. **数据 Cutoff 后的新文本能加入吗？** 可建立新版本或时间切片，但要保留旧集以维持历史可比性。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
