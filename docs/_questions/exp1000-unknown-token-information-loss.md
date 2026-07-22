---
title: '使用 UNK Token 会丢失什么信息，为什么现代 LLM 尽量避免它？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '简单'
study_tier: 'extended'
tags:
  - 'UNK'
  - 'Tokenizer'
  - 'OOV'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

强调多个不同字符串映射到同一 ID 后不可逆，模型无法区分。

**可以这样答：**

> 所有未登录片段若都映射为同一个 UNK，原始拼写、字符和类别差异会被抹掉。模型看到相同 ID 后无法判断这里原本是人名、生僻字还是乱码，输出也无法可靠还原。子词和 Byte Fallback 让开放词表文本可以分解表示，因此现代生成模型通常把 UNK 只留作兼容或异常情况。

## 常见追问

1. **有 UNK 就一定设计错误吗？** 不一定，封闭标签或特殊输入管线可以使用，但开放文本生成应谨慎。
2. **怎样监控线上 UNK 问题？** 记录 UNK 率及其输入语言和来源，并对突增做告警和样本回放。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
