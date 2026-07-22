---
title: '3D 并行中 Rank 到 DP、TP、PP Group 的映射为什么容易出错？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Process Group'
  - '3D Parallel'
  - 'Rank Mapping'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明每个维度的 Group 成员必须一致且覆盖正交，并结合物理拓扑放置。

**可以这样答：**

> 同一个全局 Rank 同时属于一个 DP Group、一个 TP Group 和一个 PP Group，各组成员要按一致坐标规则生成。映射错误会让 Collective 等待不同成员而 Hang，或在错误参数分片之间通信导致静默错误。应打印每个 Rank 的逻辑坐标和物理设备，验证组大小、交集和覆盖，并让高频 TP Group 尽量落在高速互联内。

## 常见追问

1. **只要 Group Size 正确就安全吗？** 不够，成员顺序和参数分片语义也必须一致。
2. **为什么环境变量 Rank 容易混淆？** Global Rank、Local Rank、Node Rank 和各并行维度 Rank 是不同概念。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
