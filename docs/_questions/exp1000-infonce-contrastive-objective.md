---
title: 'InfoNCE 损失怎样拉近正样本并推远负样本？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'NLP 与机器学习'
difficulty: '中等'
study_tier: 'archive'
tags:
  - '对比学习'
  - 'InfoNCE'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

建议按“结论—例子—边界”回答“InfoNCE 对比目标”：核心判断要明确，验证要可复现，并说明假负例、Batch 组成和温度会显著改变学习信号。

**可以这样答：**

> 关键点是，对每个锚点把正样本相似度作为正确类别，与批内负样本共同做温度缩放的交叉熵。验证时可以这样做：手算一个锚点、一个正例和两个负例的概率。但假负例、Batch 组成和温度会显著改变学习信号。

## 常见追问

1. **“InfoNCE 对比目标”最需要讲清的核心内容是什么？** 对每个锚点把正样本相似度作为正确类别，与批内负样本共同做温度缩放的交叉熵
2. **哪项具体检查可以支撑你对“InfoNCE 对比目标”的判断？** 手算一个锚点、一个正例和两个负例的概率
3. **“InfoNCE 对比目标”最容易被忽略的前提是什么？** 假负例、Batch 组成和温度会显著改变学习信号

## 延伸阅读

- [Stanford CS224N](https://web.stanford.edu/class/cs224n/)
