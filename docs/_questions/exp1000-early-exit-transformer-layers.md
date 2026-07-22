---
title: 'Transformer 的 Early Exit 怎样判断可以提前结束计算？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'Early Exit'
  - '动态计算'
  - '推理效率'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

讲清中间层预测头、置信度门槛和校准风险，不要只说“简单样本少算几层”。

**可以这样答：**

> Early Exit 在若干中间层接预测头，根据置信度、熵或层间预测稳定性决定是否跳过后续层。它让简单 Token 或样本使用更少计算，难样本继续走完整网络。中间层置信度常未校准，逐 Token 提前退出还会影响后续 KV 表示，所以训练和服务调度都比分类模型更复杂。

## 常见追问

1. **生成任务为何比句子分类更难 Early Exit？** 每个 Token 的退出深度可能不同，且当前隐藏状态会成为后续 Token 的上下文。
2. **如何控制质量损失？** 在代表性验证集上校准门槛，并设最大退出误差或关键请求禁用动态深度。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
