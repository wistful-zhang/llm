---
title: 'Differential Privacy 的 epsilon 应该怎样解释？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '评测与安全'
difficulty: '困难'
study_tier: 'archive'
tags:
  - '差分隐私'
  - '隐私'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

口述“差分隐私保证”时，先回答它是什么或怎么做，再用例子落地，最后交代适用限制：epsilon 不是泄漏概率，预算解释依赖邻接定义和组合方式。

**可以这样答：**

> 相邻数据集只差一个样本时，输出分布比值受 epsilon 和 delta 约束，从而限制单个样本影响。要验证这一点，可以采用这个办法：在 DP-SGD 中记录裁剪、噪声、采样率和累计隐私预算。使用时不能忽略，epsilon 不是泄漏概率，预算解释依赖邻接定义和组合方式。

## 常见追问

1. **请用自己的话说明“差分隐私保证”的核心做法。** 相邻数据集只差一个样本时，输出分布比值受 epsilon 和 delta 约束，从而限制单个样本影响
2. **你准备怎样举例证明自己理解“差分隐私保证”？** 在 DP-SGD 中记录裁剪、噪声、采样率和累计隐私预算
3. **使用“差分隐私保证”前还要确认什么？** epsilon 不是泄漏概率，预算解释依赖邻接定义和组合方式

## 延伸阅读

- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
