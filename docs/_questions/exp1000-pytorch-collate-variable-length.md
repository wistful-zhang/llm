---
title: '怎样写 collate_fn 处理变长文本 Batch？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '中等'
study_tier: 'archive'
tags:
  - 'PyTorch'
  - 'Collate'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

回答“变长样本组批”时，先给出核心结论，再补一个能检查结论的例子，最后主动说明这条边界：全局固定最长 Padding 浪费计算，截断策略也不能静默丢失关键答案。

**可以这样答：**

> 先 Tokenize 或读取序列，再按 Batch 内最大长度 Padding，返回 input_ids、attention_mask 和未填充长度。一个直接的检查办法是：混合空文本、超长文本和不同标签，检查 Shape 与 Mask。这个结论的边界是，全局固定最长 Padding 浪费计算，截断策略也不能静默丢失关键答案。

## 常见追问

1. **请把“变长样本组批”的核心结论压缩成一句话。** 先 Tokenize 或读取序列，再按 Batch 内最大长度 Padding，返回 input_ids、attention_mask 和未填充长度
2. **你会用什么例子或检查验证“变长样本组批”？** 混合空文本、超长文本和不同标签，检查 Shape 与 Mask
3. **“变长样本组批”最重要的适用边界是什么？** 全局固定最长 Padding 浪费计算，截断策略也不能静默丢失关键答案

## 延伸阅读

- [PyTorch 官方文档](https://docs.pytorch.org/docs/stable/)
