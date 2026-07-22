---
title: '代码 Tokenizer 为什么要特别处理空格、缩进和换行？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - '代码模型'
  - 'Whitespace'
  - 'Tokenizer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明这些符号在代码中具有语法和格式含义，同时可能导致长重复序列。

**可以这样答：**

> Python 缩进直接决定语法，其他语言的换行和空格也影响可读性、格式化与字符串字面量。若逐个空格编码，缩进会制造大量低信息 Token；若全部折叠，又会丢失程序含义。代码 Tokenizer 常为常见缩进宽度、换行和运算符学习专用 Token，同时保留任意空白的可逆表示。

## 常见追问

1. **Tab 和四个空格能归一化成一样吗？** 要谨慎，部分语言和工具链区分它们，保留原文通常更安全。
2. **为什么代码词表常包含整段符号组合？** 常见运算符和语法片段合并后能减少序列长度并保留局部结构。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
