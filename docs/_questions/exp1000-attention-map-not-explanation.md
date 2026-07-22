---
title: '为什么 Attention Map 不能直接当作模型解释？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'Attention Map'
  - '可解释性'
  - '因果分析'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从 Value、W_O、多层残差和替代注意力分布四点说明相关性不等于因果性。

**可以这样答：**

> Attention Map 只展示位置权重，没有包含 Value 中传递了什么，也没有包含 W_O 如何写回。最终预测还叠加多层、多头、FFN 和残差路径，同一输出可能由其他路径补偿。可信解释需要做 Head 或边的消融、Activation Patching 等因果干预，并检查结论是否跨样本稳定。

## 常见追问

1. **Attention Rollout 能解决吗？** 它能汇总多层路径但仍基于权重近似，不能替代直接干预。
2. **注意力图还有什么价值？** 适合发现模式、提出假设和调试 Mask，但不应单独证明决策原因。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
