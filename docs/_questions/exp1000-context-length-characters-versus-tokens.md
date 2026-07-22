---
title: '产品写“支持十万字”为什么不如写 Token 上限准确？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '简单'
tags:
  - '上下文长度'
  - 'Token'
  - '产品指标'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明不同语言、代码和格式的字符到 Token 比例差异很大。

**可以这样答：**

> 模型真正限制的是 Token 数，而同样字符数在英文、中文、代码、Emoji 和 Base64 中的 Token 比例差异很大。写“十万字”只能是某类样本上的经验换算，遇到碎片化文本可能远低于承诺。产品应公布 Token 上限，并提供基于实际 Tokenizer 的预估与超限处理。

## 常见追问

1. **图片也占 Token 上限吗？** 多模态模型通常把图片转成视觉 Token，它们也会占用上下文预算，但计算方式由模型定义。
2. **输出 Token 是否占同一个窗口？** 多数模型要求输入加已生成输出不超过上下文上限，服务需预留生成空间。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
