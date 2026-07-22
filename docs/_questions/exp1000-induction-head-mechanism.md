---
title: 'Induction Head 如何完成“看到 A B，再遇到 A 就预测 B”的模式？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'Induction Head'
  - 'In-Context Learning'
  - 'Attention'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

用前一 Token 匹配与复制后继 Token 的两步电路解释。

**可以这样答：**

> 一种经典电路先让表示携带前一个 Token 的信息，再由 Induction Head 用当前上下文匹配历史中相同前缀。找到过去的 A 后，它把 A 后面的 B 所对应信息复制到当前位置，从而延续模式。该机制能解释一部分上下文内重复和类比行为，但真实大模型的 In-Context Learning 由许多层和 Head 协同，不应归结为单个电路。

## 常见追问

1. **为什么通常需要不止一个 Head？** 前序 Token 信息的搬运和后继内容的检索可能由不同 Head 分工完成。
2. **怎样验证 Induction Head？** 可用重复序列构造行为测试，并结合 Head 消融和路径干预观察因果影响。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
