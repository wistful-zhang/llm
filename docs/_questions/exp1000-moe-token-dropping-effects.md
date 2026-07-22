---
title: 'MoE 训练中的 Token Dropping 会怎样影响模型，为什么推理时尤其危险？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'MoE'
  - 'Token Dropping'
  - '容量'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明溢出 Token 跳过专家计算后的残差路径，以及训练推理一致性问题。

**可以这样答：**

> 当 Expert 超过容量时，部分实现会让溢出 Token 跳过该专家，仅沿残差路径继续。少量随机丢弃可被训练吸收，但持续丢弃特定类型 Token 会造成偏差和能力缺口。推理时用户输入不可随意牺牲，Token Dropping 会让结果随并发负载变化，因此服务通常追求无丢弃或明确改道。

## 常见追问

1. **可以把溢出 Token 发给第二选择吗？** 可以，但会增加路由和通信复杂度，也可能让第二 Expert 再次过载。
2. **如何发现 Dropping 正在伤害训练？** 按层和专家监控丢弃率，并关联 Token 类型、Loss 和验证集退化。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
