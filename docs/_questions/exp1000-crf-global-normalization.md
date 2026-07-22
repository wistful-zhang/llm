---
title: '线性链 CRF 为什么比逐 Token 分类更适合序列标注？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'NLP 与机器学习'
difficulty: '中等'
study_tier: 'archive'
tags:
  - 'CRF'
  - '序列标注'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

建议按“结论—例子—边界”回答“CRF 全局归一化”：核心判断要明确，验证要可复现，并说明线性链只建模局部标签依赖，标签集大时动态规划成本上升。

**可以这样答：**

> 可以从这条主线理解：CRF 同时评分发射和标签转移，对完整标签序列归一化，从而学习 BIO 等结构约束。再用一个最小验证说明：比较逐位置 argmax 与 Viterbi 解码是否产生非法 I 标签。最后明确限制：线性链只建模局部标签依赖，标签集大时动态规划成本上升。

## 常见追问

1. **“CRF 全局归一化”最需要讲清的核心内容是什么？** CRF 同时评分发射和标签转移，对完整标签序列归一化，从而学习 BIO 等结构约束
2. **哪项具体检查可以支撑你对“CRF 全局归一化”的判断？** 比较逐位置 argmax 与 Viterbi 解码是否产生非法 I 标签
3. **“CRF 全局归一化”最容易被忽略的前提是什么？** 线性链只建模局部标签依赖，标签集大时动态规划成本上升

## 延伸阅读

- [Stanford CS224N](https://web.stanford.edu/class/cs224n/)
