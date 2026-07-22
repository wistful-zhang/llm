---
title: 'Token Offset Mapping 为什么在标注和引用场景中容易出错？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'Offset Mapping'
  - 'Tokenizer'
  - 'Unicode'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

区分 Byte、码点、UTF-16 Code Unit 和 Grapheme 的索引单位，再讲归一化映射。

**可以这样答：**

> 不同系统的 Offset 可能按 UTF-8 Byte、Unicode 码点或 UTF-16 Code Unit 计数，同一 Emoji 在这些口径下长度不同。Tokenizer 若先归一化文本，Token 边界对应的是规范化字符串，不一定能一一映回原文。端到端必须声明索引单位、保留归一化对齐，并用组合字符和 Emoji 做测试，否则高亮与引用会错位。

## 常见追问

1. **JavaScript 字符串索引是什么单位？** 通常按 UTF-16 Code Unit，不等同于用户看到的字符数。
2. **怎样处理一个 Token 覆盖半个单词？** 标注系统要定义扩展到完整 Token、使用字符级标签或保存子 Token 对齐规则。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
