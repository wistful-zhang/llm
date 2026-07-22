---
title: 'DistributedSampler 为什么每个 Epoch 要调用 set_epoch？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '中等'
study_tier: 'archive'
tags:
  - 'PyTorch'
  - 'DistributedSampler'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

先用自己的话说清“分布式采样洗牌”，再给出一项可检查的证据或例子；结尾别漏掉数据量不能整除时可能补样本或丢弃，指标汇总需知道这一行为。

**可以这样答：**

> 这件事可以概括为：各 Rank 用共同 Seed 和 Epoch 派生一致全局排列后取不同分片，set_epoch 让每轮排列变化。落到实验或实现上，运行两轮记录各 Rank 索引，检查无意重复与覆盖。同时要确认，数据量不能整除时可能补样本或丢弃，指标汇总需知道这一行为。

## 常见追问

1. **如果只保留一个要点，“分布式采样洗牌”是什么？** 各 Rank 用共同 Seed 和 Epoch 派生一致全局排列后取不同分片，set_epoch 让每轮排列变化
2. **给出一个可以复现或手工检查“分布式采样洗牌”的办法。** 运行两轮记录各 Rank 索引，检查无意重复与覆盖
3. **在哪种条件下，“分布式采样洗牌”会失效或被误读？** 数据量不能整除时可能补样本或丢弃，指标汇总需知道这一行为

## 延伸阅读

- [PyTorch 官方文档](https://docs.pytorch.org/docs/stable/)
