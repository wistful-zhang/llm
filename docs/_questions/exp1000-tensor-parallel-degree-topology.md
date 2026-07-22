---
title: 'Tensor Parallel Degree 为什么通常优先限制在单机高速互联范围内？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Tensor Parallel'
  - '拓扑'
  - 'NVLink'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明每层频繁 Collective 对低延迟高带宽要求高，跨节点网络更难隐藏。

**可以这样答：**

> Tensor Parallel 几乎每个 Transformer 层都要做 All-Reduce、Reduce-Scatter 或 All-Gather，通信频率很高。单机 NVLink 或同类互联延迟低、带宽高，跨节点 InfiniBand 即使总带宽不错也更难承受细粒度同步。通常先在节点内做 TP，再用数据并行或流水线跨节点，但具体仍要按模型宽度和网络拓扑测量。

## 常见追问

1. **模型单层放不进一台机器怎么办？** 必须跨节点 TP 或结合其他分片，此时要增大计算粒度并优化通信拓扑。
2. **TP Degree 过大为何矩阵变慢？** 每 Rank 本地矩阵变窄，计算效率下降，而通信占比继续上升。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
