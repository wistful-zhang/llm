---
title: '变长序列训练时，Loss 按 Token 平均还是按 Sequence 平均有什么区别？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Loss Normalization'
  - '变长序列'
  - 'Batch'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 Token 平均让每个有效 Token 等权，Sequence 平均会提高短样本单 Token 权重。

**可以这样答：**

> 按全 Batch 有效 Token 平均时，每个预测位置权重相同，长序列因 Token 多贡献更多总梯度。先对每条 Sequence 平均再对样本平均，会让短序列的单 Token 权重更高。两者对应不同训练目标，分布式和梯度累积时必须用全局有效 Token 数归一化，否则各 Rank 长度差会产生偏置。

## 常见追问

1. **Padding 应进入分母吗？** 不应，未参与 Loss 的 Padding 会稀释有效梯度。
2. **SFT 为什么有时按样本平均？** 希望每个指令样本权重接近，而不让长回答自动主导，但需要明确任务目标。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
