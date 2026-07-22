---
title: 'Causal Self-Attention 为什么通常允许当前位置关注自己？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '简单'
tags:
  - 'Causal Attention'
  - '对角线'
  - 'Label Shift'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

明确当前位置输入是已知 Token，而预测目标是下一个 Token。

**可以这样答：**

> 位置 t 的输入 Token x_t 已经属于条件信息，模型用该位置隐藏状态预测 x_{t+1}。因此注意力允许读到对角线并不泄漏下一个标签，反而保证当前 Token 的内容能进入表示。只有当标签与输入未正确 Shift，或任务定义为预测当前被遮盖 Token 时，对角线规则才需要改变。

## 常见追问

1. **第一个位置预测什么？** 通常 BOS 位置预测第一个正文 Token，具体取决于序列和标签构造。
2. **对角线被屏蔽会完全看不到自己吗？** 残差路径仍携带当前输入，但 Attention 分支不能直接把当前 Value 纳入汇聚。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
