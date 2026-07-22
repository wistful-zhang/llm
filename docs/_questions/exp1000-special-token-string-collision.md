---
title: 'Special Token 的文本串与普通用户文本发生 Collision 时怎么办？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'Special Token'
  - '安全'
  - 'Tokenizer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

区分普通文本编码和显式允许特殊 Token 的编码路径，并强调转义。

**可以这样答：**

> 若用户输入恰好包含系统使用的特殊标记，Tokenizer 不应默认把它解释成控制 Token，否则可能伪造角色边界或结束信号。安全实现会在普通编码时禁止或转义 Special Token，只允许模板代码通过受控接口插入对应 ID。解码和日志也要区分可见字符串与真实特殊 ID，避免二次解析。

## 常见追问

1. **把特殊标记换成很罕见的字符串够吗？** 不够，用户仍可复制该字符串，关键是编码接口的权限和转义语义。
2. **为什么这是 Prompt Injection 风险？** 伪造角色或边界 Token 可能让模型把用户内容误当系统指令或模板结构。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
