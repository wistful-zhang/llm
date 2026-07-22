---
title: 'Byte、Unicode 字符和 Token 是什么关系，为什么不能混为一谈？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '简单'
tags:
  - 'Tokenizer'
  - 'Unicode'
  - 'Token'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从编码层、文本符号层和模型离散单元层依次解释，并给出一个字符拆成多个 Token 的情况。

**可以这样答：**

> Byte 是存储编码的基本单位，Unicode 字符是抽象文本符号，Token 则是 Tokenizer 按词表切出的模型输入单元。一个中文字符在 UTF-8 中占多个 Byte，却可能对应一个 Token；生僻字也可能拆成多个 Byte Token。模型上下文和计费按 Token 计算，不能用字符数或文件字节数直接替代。

## 常见追问

1. **英文单词一定是一个 Token 吗？** 不一定，常见词可能一个 Token，罕见词、大小写或前导空格变化都可能被拆分。
2. **为什么 Byte-Level Tokenizer 没有真正的 OOV？** 任意输入最终都能退回有限的 Byte 集合表示，不需要未知词占位。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
