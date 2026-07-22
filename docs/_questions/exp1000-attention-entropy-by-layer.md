---
title: 'Attention Entropy 随层数变化能说明什么，又不能说明什么？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Attention Entropy'
  - '可解释性'
  - '诊断'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

先定义分布尖锐度，再强调低熵不等于更重要或更正确。

**可以这样答：**

> Attention Entropy 衡量一个 Query 的权重分布是集中还是分散，可用于发现层间模式、过度饱和或异常 Head。低熵表示集中在少数位置，高熵表示广泛汇聚，但两者都可能是合理策略。它不包含 Value 内容和输出投影的影响，因此不能单凭熵判断某层贡献或模型质量。

## 常见追问

1. **上下文变长会自然提高熵吗？** 候选位置增多可能影响熵，比较时应考虑长度并可使用归一化熵。
2. **如何判断低熵是异常？** 要和训练阶段、验证损失、Logit 范数及特定任务行为联合分析。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
