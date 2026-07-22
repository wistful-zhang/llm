---
title: '为什么架构中常让 BOS、CLS 或专用 Memory Token 拥有特殊注意力权限？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
tags:
  - 'Special Token'
  - 'Global Attention'
  - '信息汇聚'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明它们作为全局汇聚或广播节点缩短信息路径，并提醒任务语义要靠训练形成。

**可以这样答：**

> 给特殊 Token 全局可见权限，可以让它在稀疏或局部 Attention 中汇聚整段信息，再把摘要广播给其他位置。它还提供固定边界和任务控制入口，便于分类头或记忆模块读取。特殊权限本身不赋予语义，若训练目标没有推动其承担功能，它也可能只成为 Attention Sink。

## 常见追问

1. **全局 Token 越多越好吗？** 不一定，数量增加会提高每层计算并可能稀释各自分工。
2. **生成模型的 BOS 一定是摘要 Token 吗？** 不一定，它可能主要标记序列开始或承担 Sink 作用，需要因果分析确认。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
