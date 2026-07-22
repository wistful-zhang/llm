---
title: '设计 Sparse Attention 时，为什么要关注多层后的 Connectivity？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'Sparse Attention'
  - '长上下文'
  - '感受野'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明单层不可见不等于永远不可达，关键是信息经过多少层能传播。

**可以这样答：**

> Sparse Attention 每层只连接部分 Token，单层复杂度下降，但远距离信息必须沿连接图逐层传播。若图不连通或路径过长，某些位置即使堆很多层也难以交换信息。设计时要检查多层感受野、最短路径和全局节点，而不能只报告每层保留了多少注意力边。

## 常见追问

1. **加入少量 Global Token 有什么作用？** 它们充当信息枢纽，可显著缩短任意两位置之间的传播路径。
2. **稀疏率越高速度一定越快吗？** 不一定，不规则索引和小块计算可能让硬件利用率下降。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
