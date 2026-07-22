---
title: '什么是 Attention Sink，为什么开头几个 Token 常吸收大量注意力？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Attention Sink'
  - '长上下文'
  - '模型机制'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把 Softmax 必须分配概率质量与无关查询的默认落点联系起来。

**可以这样答：**

> 某些 Query 没有明确相关的历史位置，但 Softmax 仍必须把概率质量分配出去，开头的特殊 Token 便可能成为稳定落点。训练久后模型会把这些位置塑造成几乎不传递有害内容的 Attention Sink。流式窗口若直接丢掉它们，后续注意力分布会改变，所以一些方法会永久保留少量起始 Token。

## 常见追问

1. **Sink Token 等同于全局语义摘要吗？** 不等同，它可能主要承担概率排放作用，并不必然编码完整语义。
2. **人为添加 Sink Token 有什么好处？** 它给无关注意力一个固定落点，可改善滑动窗口或流式推理的稳定性。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
