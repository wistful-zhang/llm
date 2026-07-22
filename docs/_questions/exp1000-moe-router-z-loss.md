---
title: 'MoE Router Z-Loss 在约束什么，为什么只做负载均衡还不够？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'MoE'
  - 'Router'
  - 'Z-Loss'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把 Z-Loss 与 Router Logit 的整体幅度联系起来，区分它和专家使用比例。

**可以这样答：**

> Router Z-Loss 通常惩罚 logsumexp(router logits) 的平方，限制路由 Logit 整体变得过大。过大的 Logit 会让 Softmax 极端饱和，带来数值不稳定和难以改变的硬路由。负载均衡损失只关心 Token 是否均匀分给专家，并不直接约束 Logit 的绝对尺度，所以两者解决的问题不同。

## 常见追问

1. **Z-Loss 系数太大有什么风险？** 会过度压平路由分布，使专家选择缺少区分度并影响专业化。
2. **它与普通分类的 Label Smoothing 相同吗？** 不同，Z-Loss 约束归一化常数，Label Smoothing 改变目标分布。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
