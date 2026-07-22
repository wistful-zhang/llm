---
title: '做预训练 Data Ablation 时，为什么必须固定 Token Budget？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '中等'
tags:
  - 'Data Ablation'
  - 'Token Budget'
  - '实验设计'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明删除数据后若总 Token 变少，无法区分数据质量和训练量效应。

**可以这样答：**

> 移除某来源后若模型少训练一部分 Token，结果变化同时包含数据内容和总训练量差异。公平消融应固定总 Token、优化步数和主要超参数，用其他来源补足预算，或同时报告不补足版本。还要关注替代数据被重复采样多少次，因为补足 Token 可能引入额外 Epoch 效应。

## 常见追问

1. **固定 FLOPs 比固定 Token 更好吗？** 架构不变时两者近似相关，但长度与打包差异仍会改变实际 FLOPs，应同时记录。
2. **一次只删一个来源够吗？** 可估主效应，但来源间存在交互，关键组合还需做多因素实验。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
