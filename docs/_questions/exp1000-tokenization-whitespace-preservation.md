---
title: 'Tokenizer 是否应该保留连续空格和尾随空格？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Whitespace'
  - 'Tokenizer'
  - '可逆性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

按自然语言、代码、表格和精确编辑任务分别说明，避免绝对结论。

**可以这样答：**

> 普通自然语言中折叠多余空格可减少噪声和序列长度，但代码、Markdown 表格、对齐文本和字符串字面量可能依赖精确空白。若预训练时被清洗，模型无法在需要时可靠恢复原格式。通用 LLM 通常倾向保留可逆空白，再在特定数据清洗阶段有意识处理，而不是让 Tokenizer 静默丢失。

## 常见追问

1. **尾随空格为什么也会影响生成？** 它可能改变下一个词的 Token 边界，代码补全中还会改变缩进语义。
2. **连续空格会很浪费 Token 吗？** 词表可为常见空格长度学习合并 Token，但极端长度仍应做输入限制。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
