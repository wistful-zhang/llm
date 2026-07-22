---
title: 'Base64、哈希和压缩文本为什么会让 Token 数异常膨胀？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '简单'
study_tier: 'extended'
tags:
  - 'Base64'
  - 'Token 膨胀'
  - '输入治理'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明这些字符串缺少自然语言重复片段，常退化为小块字符 Token。

**可以这样答：**

> Base64 和哈希近似高熵字符序列，缺少词表中高频自然语言子词，往往只能按少数字符切分。它们语义密度对模型又很低，却快速占满上下文并增加 Attention 成本。产品应识别这类输入，改用文件解析、外部存储或长度限制，而不是原样塞进 Prompt。

## 常见追问

1. **扩大词表覆盖 Base64 有意义吗？** 可稍微压缩常见字符块，但组合近似随机，词表收益有限且占用容量。
2. **模型能理解压缩后的二进制吗？** 通常不能，编码可表示不等于模型学会了解码和理解其内容。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
