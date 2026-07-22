---
title: '为什么 Prompt 只改一个空格，模型输出也可能明显变化？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '简单'
tags:
  - 'Prompt'
  - 'Token Boundary'
  - 'Tokenizer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

先检查 Token 序列是否整体变化，再说明模型不是按人眼字符相似度处理。

**可以这样答：**

> 许多 Tokenizer 把前导空格与后续单词合成不同 Token，一个空格可能改变多个切分边界和 ID。模型看到的是离散 Token 与位置，而不是人眼认为几乎相同的字符串。变化还可能碰到 Chat Template 分隔或代码缩进，因此调试 Prompt 应先打印 Token，而不是只做字符串 Diff。

## 常见追问

1. **大小写变化也会这样吗？** 会，大小写可能对应完全不同的单 Token 或子词序列。
2. **能靠文本归一化消除敏感性吗？** 可减少部分变体，但会改变代码、专名和格式语义，不能无条件使用。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
