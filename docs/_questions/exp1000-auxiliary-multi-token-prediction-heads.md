---
title: 'Multi-Token Prediction 为什么在主 Next-Token Head 外再预测后续多个 Token？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
tags:
  - 'Multi-Token Prediction'
  - '预训练目标'
  - '预测头'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明额外监督提高每个位置的训练信号，并区分训练辅助头与推理使用方式。

**可以这样答：**

> 标准目标让位置 t 只预测 t+1，Multi-Token Prediction 再用辅助 Head 预测 t+2、t+3 等未来 Token。一个隐藏状态因此接收更密集的未来结构监督，可能改善数据效率和规划能力。辅助 Head 可在训练后丢弃，也可用于推测解码，但不同步长的损失权重和信息泄漏边界必须设计正确。

## 常见追问

1. **辅助 Head 能共享参数吗？** 可以部分共享，但不同预测距离的条件分布不同，常保留独立投影或变换层。
2. **为什么不直接把未来 Token 都作为同一个分类目标？** 每个未来位置有独立标签和不确定性，需要分别建模而不是混成一个分布。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
