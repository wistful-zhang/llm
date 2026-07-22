---
title: 'All-Reduce 与 Reduce-Scatter 加 All-Gather 在分布式训练中是什么关系？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'All-Reduce'
  - 'Reduce-Scatter'
  - 'All-Gather'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 All-Reduce 可分解为 Reduce-Scatter 和 All-Gather，并解释分片状态为何只需前半段。

**可以这样答：**

> All-Reduce 让所有 Rank 得到完整归约结果，常可实现为先 Reduce-Scatter 得到各自结果分片，再 All-Gather 拼回完整张量。若后续优化器或参数本来就是分片的，就可以停在 Reduce-Scatter，避免每个 Rank 保存完整梯度。需要完整参数计算时再 All-Gather，这正是 ZeRO/FSDP 通信与存储折中的基础。

## 常见追问

1. **两阶段通信量一定等于 Ring All-Reduce 吗？** Ring All-Reduce 本身就常由这两阶段组成，实际量取决于算法和拓扑。
2. **Reduce-Scatter 后怎样对应参数分片？** 梯度切分顺序必须与参数和优化器状态的分片布局一致。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
