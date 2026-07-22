---
title: '流式数据集怎样做到断点续训后不重复也不漏样本？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
tags:
  - 'Streaming Dataset'
  - '断点续训'
  - '确定性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

列出 Shard 顺序、样本偏移、Shuffle 状态、Epoch 和各 Rank 分片状态。

**可以这样答：**

> 检查点要保存数据集版本、全局 Shard 顺序、当前 Shard 与样本偏移，以及 Shuffle Buffer 和随机数状态。分布式训练还需记录 World Size、Rank 分片规则和已消费的全局 Token，扩缩容时重新映射剩余工作。只保存 Step 数再跳过同样数量往往不可靠，因为变长样本、过滤和并发预取都会改变实际消费顺序。

## 常见追问

1. **重复少量样本真的有问题吗？** 可能可接受，但必须可量化；大规模故障频繁时重复会累积并改变 Data Mix。
2. **数据版本变化后还能精确恢复吗？** 通常不能，应固定不可变 Manifest，或明确从新数据边界开始新阶段。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
