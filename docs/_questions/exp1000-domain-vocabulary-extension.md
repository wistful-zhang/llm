---
title: '领域继续训练前，什么时候值得扩充 Tokenizer 词表？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练与对齐'
difficulty: '中等'
tags:
  - '领域词表'
  - '继续预训练'
  - 'Tokenizer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

用领域术语的切碎率、语料规模和新 Embedding 学习机会判断。

**可以这样答：**

> 若大量高频领域术语被切成很长序列，扩词表可降低 Token 成本并让术语拥有直接表示。只有继续训练数据足够多，新 Token 才能学到稳定 Embedding；小数据场景增加词表反而留下欠训练向量。还要权衡与基础模型兼容性，很多情况下保留原 Tokenizer、让模型组合子词更稳妥。

## 常见追问

1. **怎样初始化领域 Token？** 可用其原子词 Embedding 的均值或加权组合初始化，再通过继续训练调整。
2. **扩词表会影响旧文本吗？** 若新 Merge 改变旧字符串切分就会影响，应限制触发范围并做回归。

## 延伸阅读

- [Hugging Face TRL 文档](https://huggingface.co/docs/trl/index)
