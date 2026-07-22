---
title: 'Special Token 与正文之间是否加空格，为什么会改变模型行为？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '简单'
tags:
  - 'Special Token'
  - 'Chat Template'
  - 'Whitespace'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明空格会改变正文首 Token，训练模板中的邻接关系本身也是协议。

**可以这样答：**

> Special Token 通常作为独立 ID 插入，但其后是否有换行或空格会改变正文第一个子词的切分。模型在训练中还学会了角色标记后紧接哪类格式，额外空格会造成协议偏移。应逐 Token 复现官方模板，不要根据渲染后看起来相似就随意增删空白。

## 常见追问

1. **Special Token 自己会吸收空格吗？** Added Token 可配置左右 Strip 行为，具体取决于 Tokenizer 定义。
2. **为什么 Decode 后看不出差异？** 后处理可能隐藏特殊标记或合并空白，但模型输入 ID 已经不同。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
