---
title: '调整预训练 Data Mix 时，为什么不能只看总 Validation Loss？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Data Mix'
  - 'Validation'
  - '领域评估'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明总 Loss 会被大域支配，应使用固定分域验证集和目标能力切片。

**可以这样答：**

> 总 Validation Loss 按 Token 聚合，高占比网页域的小改善可能掩盖代码、数学或低资源语言的大幅退化。应建立不随训练 Mix 改变的分域验证集，分别看 Loss、下游能力和遗忘。汇总时可以按产品目标加权，但必须保留原始切片，避免优化一个加权分数隐藏代价。

## 常见追问

1. **验证集权重应等于训练 Mix 吗？** 不一定，验证集服务于目标判断，可按真实应用或战略能力加权。
2. **为什么验证集不能随新 Mix 重采样？** 评估分布同时变化后，曲线差异无法归因于模型而非试卷变化。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
