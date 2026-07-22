---
title: 'Vocabulary Parallel 下怎样计算精确 Cross-Entropy，而不 All-Gather 全量 Logit？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Vocabulary Parallel'
  - 'Cross Entropy'
  - 'Tensor Parallel'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明先全局 Max，再全局 SumExp，并由持有目标 Token 的 Rank提供目标 Logit。

**可以这样答：**

> 每个 Rank 只计算一段词表 Logit，先 All-Reduce 各分片最大值得到每个 Token 的全局 Max。各 Rank 计算平移后的局部 Exp Sum，再 All-Reduce 得到全局 Softmax 分母。目标 Token 只落在一个分片，该 Rank 取出目标 Logit，其他 Rank 给零后归约，就能得到精确 NLL 而无需收集整个词表。

## 常见追问

1. **为什么先做全局 Max？** 数值稳定需要所有分片使用同一个最大 Logit 进行平移。
2. **反向需要全量概率吗？** 每个 Rank 只保留本地词表概率并减去本地目标 One-Hot，可分片计算梯度。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
