---
title: 'HMM 的 Forward 与 Viterbi 算法分别求什么？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'NLP 与机器学习'
difficulty: '中等'
tags:
  - 'HMM'
  - '动态规划'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

回答“HMM 两类动态规划”时，先给出核心结论，再补一个能检查结论的例子，最后主动说明这条边界：概率连乘需转 log 或缩放，最可能路径不等于每位置边缘概率最大。

**可以这样答：**

> 关键点是，Forward 对所有隐状态路径求和得到观测概率，Viterbi 取最大路径得到最可能状态序列。验证时可以这样做：对两状态小模型逐步填写概率表和回溯指针。但概率连乘需转 log 或缩放，最可能路径不等于每位置边缘概率最大。

## 常见追问

1. **请把“HMM 两类动态规划”的核心结论压缩成一句话。** Forward 对所有隐状态路径求和得到观测概率，Viterbi 取最大路径得到最可能状态序列
2. **你会用什么例子或检查验证“HMM 两类动态规划”？** 对两状态小模型逐步填写概率表和回溯指针
3. **“HMM 两类动态规划”最重要的适用边界是什么？** 概率连乘需转 log 或缩放，最可能路径不等于每位置边缘概率最大

## 延伸阅读

- [Stanford CS224N](https://web.stanford.edu/class/cs224n/)
