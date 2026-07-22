---
title: 'Covariate Shift、Label Shift 与 Concept Drift 有什么区别？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'NLP 与机器学习'
difficulty: '困难'
study_tier: 'archive'
tags:
  - '分布漂移'
  - '数据'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

组织答案时围绕“数据分布漂移类型”展开：把定义或机制讲清楚，用具体例子验证，并说明现实中多种漂移可同时发生，仅看输入统计无法确认概念漂移。

**可以这样答：**

> Covariate Shift 改变输入分布，Label Shift 改变标签先验，Concept Drift 改变给定输入到标签的关系。一个直接的检查办法是：构造三个时间段并检查特征、标签比例与条件错误率。这个结论的边界是，现实中多种漂移可同时发生，仅看输入统计无法确认概念漂移。

## 常见追问

1. **不铺背景，直接说明“数据分布漂移类型”的核心机制或判断。** Covariate Shift 改变输入分布，Label Shift 改变标签先验，Concept Drift 改变给定输入到标签的关系
2. **把“数据分布漂移类型”落到一个可检查的例子，你会怎么做？** 构造三个时间段并检查特征、标签比例与条件错误率
3. **什么情况下不能直接套用“数据分布漂移类型”？** 现实中多种漂移可同时发生，仅看输入统计无法确认概念漂移

## 延伸阅读

- [Stanford CS224N](https://web.stanford.edu/class/cs224n/)
