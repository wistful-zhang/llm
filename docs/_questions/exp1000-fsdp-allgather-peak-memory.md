---
title: 'FSDP 已经分片参数，为什么 Forward 时仍可能出现显存峰值？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'FSDP'
  - 'All-Gather'
  - '峰值显存'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明执行某个单元前要 All-Gather 完整参数，并可能与预取的下一单元重叠驻留。

**可以这样答：**

> FSDP 平时每个 Rank 只保存参数分片，但计算一个 Wrap Unit 前需要 All-Gather 该单元完整权重。若当前单元参数尚未释放，下一单元又被 Prefetch，显存会同时容纳多个完整单元及激活。Wrap 粒度太大、通信流与分配时机不当都会抬高峰值，因此要结合时间线而不是只按静态分片比例估算。

## 常见追问

1. **Wrap 越细显存越低吗？** 通常单次完整参数更小，但 Collective 次数和启动开销增加。
2. **Limit All-Gathers 有什么作用？** 限制同时在途和驻留的完整参数单元，降低内存压力但可能减少预取重叠。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
