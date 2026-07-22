---
title: '为什么有些模型只对部分 Head Dimension 应用 RoPE？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'RoPE'
  - '位置编码'
  - '架构设计'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从位置敏感子空间和位置无关内容子空间的分工来回答。

**可以这样答：**

> Partial RoPE 只旋转 Q、K 的部分维度，其余维度保持不带显式旋转的位置表示。旋转部分负责相对位置信号，未旋转部分可更自由地承载内容匹配。它还会改变长上下文外推和缓存布局，因此比例属于需要结合训练配方验证的架构超参数。

## 常见追问

1. **V 也要应用 RoPE 吗？** 标准做法通常只旋转 Q 和 K，因为位置影响匹配分数，V 负责传递内容。
2. **比例太低会怎样？** 模型区分顺序和距离的容量可能不足，尤其在位置敏感任务上更明显。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
