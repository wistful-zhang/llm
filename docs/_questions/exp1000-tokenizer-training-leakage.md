---
title: '只在全量数据上训练 Tokenizer，会不会造成测试集泄漏？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Tokenizer'
  - '数据泄漏'
  - '评测'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

区分词表接触测试文本与模型参数训练，并按评测严格程度给结论。

**可以这样答：**

> Tokenizer 从测试文本统计到高频片段，可能把测试专有字符串合成更短 Token，属于一种无监督的分布信息泄漏。它通常比模型直接训练测试答案弱，但在小数据、专名识别或严格基准中仍会抬高结果。规范做法是只用训练语料学习 Tokenizer，至少要从候选语料中排除受保护评测集及其近重复。

## 常见追问

1. **预训练模型评测还能完全避免吗？** 公开互联网基准很难绝对保证，只能做时间切分、去污染和透明披露。
2. **测试文本只贡献字符集合也算泄漏吗？** 风险较低，但严格定义下仍使用了测试分布，应根据评测协议说明。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
