---
title: '用参考语言模型 Perplexity 过滤预训练文本时，为什么高低两端都要小心？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
tags:
  - 'Perplexity Filter'
  - '数据质量'
  - '选择偏差'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明高 PPL 可能是乱码也可能是新知识，低 PPL 可能是高质量也可能是模板重复。

**可以这样答：**

> 极高 Perplexity 常见于乱码、语言错判和随机字符，但也可能来自专业术语、低资源语言或真正新颖内容。极低 Perplexity 可能是流畅常识，也可能是导航模板、重复免责声明和被参考模型记住的文本。应按语言与领域分桶设置区间，结合规则和重复度，而不是用一个全局阈值定义质量。

## 常见追问

1. **参考模型会带来什么偏差？** 它偏好的语言和文风会被过滤器放大，训练数据逐渐向参考模型分布收缩。
2. **PPL 要按 Tokenizer 归一化吗？** 跨语言和模型比较应考虑每 Byte 或字符口径，否则切分差异会误导阈值。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
