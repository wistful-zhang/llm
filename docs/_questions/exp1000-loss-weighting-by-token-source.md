---
title: '按数据来源给 Token Loss 加权，与改变采样概率有什么区别？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
tags:
  - 'Loss Weighting'
  - '数据采样'
  - '优化'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

比较同一 Batch 中梯度尺度和样本出现频次，并说明优化器状态不同。

**可以这样答：**

> 提高采样概率会让某来源更频繁进入 Batch，也改变 Batch 组成、重复次数和梯度噪声。Loss 加权则在样本出现时放大其梯度，数据读取频次不变，但会改变每步有效梯度尺度。两者期望贡献可调到相近，却因方差、优化器动量和 Batch 交互产生不同训练轨迹，需要分别校准。

## 常见追问

1. **权重翻倍等同于样本复制两次吗？** 在简单梯度期望上近似，但复制会出现在不同 Batch 和优化步，动量与噪声不同。
2. **Loss 权重会影响全局梯度裁剪吗？** 会，放大样本可能更频繁触发裁剪，从而连带缩小其他来源梯度。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
