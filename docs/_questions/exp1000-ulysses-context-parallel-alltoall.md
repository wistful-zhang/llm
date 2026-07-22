---
title: 'DeepSpeed Ulysses 式 Context Parallel 为什么使用 All-to-All？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Ulysses'
  - 'Context Parallel'
  - 'All-to-All'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明先按序列分片，再通过 All-to-All 转成按 Head 分片，使每个 Head 看到完整序列。

**可以这样答：**

> 输入最初沿序列维分布，各 Rank 只持有部分 Token。All-to-All 把数据重排为每个 Rank 持有部分 Attention Head、但这些 Head 覆盖完整序列，于是可以本地计算对应 Head 的注意力。计算后再做反向 All-to-All 恢复序列分片，通信规则规整，但并行度受 Head 数可整除性和网络 All-to-All 性能限制。

## 常见追问

1. **它与 Ring Attention 的通信模式有何不同？** Ulysses 做布局转置式 All-to-All，Ring 让 K/V 块逐轮流动并增量计算。
2. **KV Head 很少时有什么限制？** 按 Head 切分的并行度受可分 KV 或 Q Head 数约束，GQA 需要特殊布局。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
