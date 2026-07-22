---
title: 'Precision 与 Recall 如何由基准率和条件概率联系起来？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '数学基础'
difficulty: '中等'
study_tier: 'archive'
tags:
  - '贝叶斯'
  - '分类指标'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

回答“分类指标的概率表达”时，先给出核心结论，再补一个能检查结论的例子，最后主动说明这条边界：跨数据集比较时若基准率不同，Precision 会变化而非模型必然退化。

**可以这样答：**

> 核心判断是，Recall 是正类条件下命中概率，Precision 是被判正后真实为正的后验，二者通过基准率和误报率联系。实际验证可采用这个办法：固定召回与误报率，改变风险事件基准率并计算 Precision。此外，跨数据集比较时若基准率不同，Precision 会变化而非模型必然退化。

## 常见追问

1. **请把“分类指标的概率表达”的核心结论压缩成一句话。** Recall 是正类条件下命中概率，Precision 是被判正后真实为正的后验，二者通过基准率和误报率联系
2. **你会用什么例子或检查验证“分类指标的概率表达”？** 固定召回与误报率，改变风险事件基准率并计算 Precision
3. **“分类指标的概率表达”最重要的适用边界是什么？** 跨数据集比较时若基准率不同，Precision 会变化而非模型必然退化

## 延伸阅读

- [Deep Learning Book](https://www.deeplearningbook.org/)
