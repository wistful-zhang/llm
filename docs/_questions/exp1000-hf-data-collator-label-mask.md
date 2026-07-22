---
title: 'SFT Data Collator 怎样同时构造 labels 与 Loss Mask？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '中等'
tags:
  - 'Transformers'
  - 'Data Collator'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

这题不要只报术语。先解释“SFT 监督 Batch”的核心逻辑，再说明如何验证，最后指出只看 loss 正常可能掩盖全被 mask 或监督到用户输入的错误。

**可以这样答：**

> 关键点是，Collator 完成 Padding，并复制 token ID 为 labels，再把不监督的 Prompt 和 Padding 位置设为 ignore_index。验证时可以这样做：解码每个位置检查回答起止和 shift 后监督是否对齐。但只看 loss 正常可能掩盖全被 mask 或监督到用户输入的错误。

## 常见追问

1. **面试官要求一句话概括“SFT 监督 Batch”时，你怎么说？** Collator 完成 Padding，并复制 token ID 为 labels，再把不监督的 Prompt 和 Padding 位置设为 ignore_index
2. **你会怎样用数据、代码或手算验证“SFT 监督 Batch”？** 解码每个位置检查回答起止和 shift 后监督是否对齐
3. **回答“SFT 监督 Batch”时必须主动补充哪项限制？** 只看 loss 正常可能掩盖全被 mask 或监督到用户输入的错误

## 延伸阅读

- [Hugging Face Transformers 文档](https://huggingface.co/docs/transformers/)
