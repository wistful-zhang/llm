---
title: '怎样判断 MoE 出现了 Expert Collapse，而不是正常专业化？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'MoE'
  - 'Expert Collapse'
  - '诊断'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

不要只看平均负载，要同时看路由熵、Token 类型和专家输出差异。

**可以这样答：**

> 正常专业化会让不同 Expert 偏好不同 Token，但总体仍有稳定利用和功能差异。Expert Collapse 常表现为少数专家长期占满、其余专家几乎无梯度，或多个专家输出高度相似却没有真正分工。应联合观察每层负载分布、路由熵、溢出率、专家梯度和按语义分组的路由结果。

## 常见追问

1. **负载完全均匀就是最好吗？** 不是，过度均匀可能阻止有意义的专业化，目标是可训练且不过载。
2. **初始化会影响 Collapse 吗？** 会，Router 或专家初始差异过大可能形成早期正反馈，让少数专家越来越热门。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
