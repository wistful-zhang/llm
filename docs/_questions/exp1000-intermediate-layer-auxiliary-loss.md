---
title: '为什么有人在 Transformer 中间层加 Auxiliary Loss？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Auxiliary Loss'
  - '深层监督'
  - '优化'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明更直接的梯度信号和中间表示约束，同时警惕目标冲突。

**可以这样答：**

> 中间层 Auxiliary Loss 能让较浅层直接收到任务信号，缩短信用分配路径并帮助超深模型优化。它还可训练 Early Exit、Multi-Token Head 或特定结构模块。若权重过大，中间层会被迫过早形成最终预测，限制后续层重构表示，因此通常采用较小或随训练衰减的系数。

## 常见追问

1. **辅助损失必须和主损失相同吗？** 不必须，可以是路由均衡、对比学习或中间预测，但要检查梯度是否冲突。
2. **训练后辅助头怎么办？** 若部署不需要可以删除，只保留它对主干参数产生的训练作用。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
