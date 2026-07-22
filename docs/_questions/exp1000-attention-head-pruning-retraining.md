---
title: '剪掉 Attention Head 后为什么通常还要微调，而不是只删除对应矩阵？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Head Pruning'
  - '模型压缩'
  - '微调'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 Head 间协作、W_O 混合和残差分布都会变化。

**可以这样答：**

> 多头输出经过 W_O 联合混合，一个 Head 的作用可能依赖其他 Head 的补充或抵消。删除后不仅少了该路径，W_O 输入分布和残差写入尺度也改变。微调能让剩余 Head 和输出投影重新分配功能；剪枝前的静态重要性指标只能筛候选，不能替代删后验证。

## 常见追问

1. **注意力权重小的 Head 就不重要吗？** 不一定，Value 幅度和 W_O 投影可能让小权重仍产生关键输出。
2. **结构化剪枝比置零好在哪里？** 真正删除矩阵块才可能减少计算和缓存，置零若内核仍执行就没有速度收益。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
