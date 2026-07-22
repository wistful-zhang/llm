---
title: 'BPE 的 Merge Rule 是怎样从语料中学出来的？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'BPE'
  - 'Merge Rule'
  - 'Tokenizer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

按初始化基础符号、统计相邻对、反复合并最高频对的过程口述。

**可以这样答：**

> BPE 先把语料表示成字符或 Byte 等基础符号序列，再统计允许边界内的相邻符号对。每轮把最高频符号对加入词表并替换语料，重复到目标词表大小。最终 Tokenization 按学到的 Merge 优先级组合片段，因此相同字符在不同边界和上下文中可能得到不同切分。

## 常见追问

1. **最高频对出现并列怎么办？** 实现需要确定稳定的 Tie-Break 规则，否则同一语料可能训练出不同词表。
2. **BPE 为什么能表示罕见词？** 罕见词可退回更小的已知子词或 Byte，不要求整词进入词表。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
