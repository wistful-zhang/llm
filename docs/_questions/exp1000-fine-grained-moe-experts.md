---
title: '把少量大 Expert 拆成更多细粒度 Expert 有什么好处和代价？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'MoE'
  - 'Expert Granularity'
  - '模型容量'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从组合数量、专业化粒度、矩阵利用率和路由通信四方面组织回答。

**可以这样答：**

> 细粒度 Expert 让同一激活参数预算下可以选择更多小模块，组合方式更多，也可能形成更具体的能力分工。它能提高路由灵活性并减少单个热门 Expert 的垄断。代价是 Expert 数增多后路由元数据、All-to-All 小消息和 Kernel 调度更复杂，太小的矩阵还会降低 GPU 利用率。

## 常见追问

1. **细粒度 Expert 一定更容易均衡吗？** 不一定，选择空间更大但热门模式仍可能集中，需要配套均衡策略。
2. **为什么矩阵太小会慢？** 计算量不足以摊薄启动和访存开销，Tensor Core 利用率也可能下降。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
