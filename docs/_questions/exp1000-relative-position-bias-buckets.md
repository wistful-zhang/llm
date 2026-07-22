---
title: '相对位置 Bias 为什么常把距离分桶，而不是每个距离一个参数？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - '相对位置'
  - 'Attention Bias'
  - '长上下文'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

用近距离精细、远距离粗略的先验解释参数共享和外推。

**可以这样答：**

> 分桶让近距离保留细粒度差异，而远距离共享较粗的 Bias，符合很多语言依赖随距离逐渐变弱的特点。它显著减少参数量，并让训练长度外的更远距离还能映射到已有桶。代价是同一远距桶内无法仅靠 Bias 区分精确距离，需要内容和其他层补充。

## 常见追问

1. **分桶通常线性还是对数？** 常在近距离使用线性桶、远距离使用对数增长，以兼顾分辨率和覆盖范围。
2. **Bias 是加在 Softmax 前还是后？** 通常加在 Attention Logit 上，也就是 Softmax 之前。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
