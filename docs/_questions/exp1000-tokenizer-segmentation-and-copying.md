---
title: 'Tokenization 粒度为什么会影响模型复制姓名、编号和 URL 的准确率？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '复制能力'
  - 'Tokenizer'
  - '实体'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明碎片越多生成步骤越多，任一步错误都会破坏整体，但大 Token 也有覆盖问题。

**可以这样答：**

> 姓名、编号和 URL 若被拆成很多 Token，模型需要连续多步都选对才能完整复制，错误概率会累积。常见片段合并能缩短生成路径，但陌生实体仍会回退到细粒度表示。提高复制可靠性还需要训练数据、Pointer 或约束解码，不能仅靠把所有实体加入词表。

## 常见追问

1. **逐字符 Token 不是更容易精确复制吗？** 它开放且可控，但序列更长，每一步条件误差和延迟都会累积。
2. **约束解码如何帮助？** 可限制下一 Token 必须与候选字符串前缀一致，减少自由生成错误。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
