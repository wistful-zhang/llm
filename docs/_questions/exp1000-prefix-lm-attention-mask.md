---
title: 'Prefix LM 的 Attention Mask 和普通因果语言模型有什么不同？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'Prefix LM'
  - 'Attention Mask'
  - '预训练目标'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

画出前缀内部双向、正文对前缀可见、正文内部因果这三块关系。

**可以这样答：**

> Prefix LM 允许前缀 Token 彼此双向可见，让前缀形成完整条件表示。生成区可以读取整个前缀，但在生成区内部仍只能看当前位置左侧。它兼顾了条件编码与自回归生成，不过训练和推理必须使用一致的边界定义。

## 常见追问

1. **Prefix LM 适合什么任务？** 给定完整输入再生成输出的摘要、问答和条件生成任务都适合。
2. **它与 Encoder-Decoder 的主要区别是什么？** Prefix LM 常在一个共享堆栈和序列内改变 Mask，而 Encoder-Decoder 使用两个堆栈和 Cross-Attention。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
