---
title: 'NFC、NFKC 等 Unicode Normalization 会怎样影响 Tokenization？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Unicode'
  - 'Normalization'
  - 'Tokenizer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

区分标准等价归一化和兼容归一化，说明可减少碎片也可能改变语义外观。

**可以这样答：**

> Unicode 中同样可见的文本可能有不同码点组合，归一化能把它们统一，降低重复词形和词表碎片。NFKC 还会折叠全角、上标或兼容字符，压缩变体更强，但可能改变代码、公式或风格信息。训练和推理必须使用同一规则，并对需要精确保真的场景做例外或保留原文映射。

## 常见追问

1. **为什么组合音标会影响 Token 数？** 预组合字符和基础字符加组合符是不同码点序列，未归一化时会走不同切分。
2. **代码数据适合直接 NFKC 吗？** 要谨慎，某些字符差异在字符串字面量或标识符中可能有实际意义。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
