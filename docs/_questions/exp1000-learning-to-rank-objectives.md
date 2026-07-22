---
title: 'Learning to Rank 的 Pointwise、Pairwise 与 Listwise 目标怎样选择？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'NLP 与机器学习'
difficulty: '中等'
tags:
  - 'Learning to Rank'
  - '排序'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

这题不要只报术语。先解释“学习排序目标”的核心逻辑，再说明如何验证，最后指出训练样本必须保留 query 分组，曝光偏差和未展示文档也会影响标签。

**可以这样答：**

> 这件事可以概括为：Pointwise 独立预测相关度，Pairwise 学习文档相对顺序，Listwise 更直接优化整列排序但训练更复杂。落到实验或实现上，在同一查询组上比较回归分数、成对偏好和列表损失的 nDCG。同时要确认，训练样本必须保留 query 分组，曝光偏差和未展示文档也会影响标签。

## 常见追问

1. **面试官要求一句话概括“学习排序目标”时，你怎么说？** Pointwise 独立预测相关度，Pairwise 学习文档相对顺序，Listwise 更直接优化整列排序但训练更复杂
2. **你会怎样用数据、代码或手算验证“学习排序目标”？** 在同一查询组上比较回归分数、成对偏好和列表损失的 nDCG
3. **回答“学习排序目标”时必须主动补充哪项限制？** 训练样本必须保留 query 分组，曝光偏差和未展示文档也会影响标签

## 延伸阅读

- [Stanford CS224N](https://web.stanford.edu/class/cs224n/)
