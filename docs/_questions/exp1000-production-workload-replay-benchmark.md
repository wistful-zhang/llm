---
title: '怎样把线上请求分布做成可复现的推理 Workload Replay？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Workload Replay'
  - '压测'
  - '流量分布'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

保留到达间隔、长度、优先级和缓存特征，内容需脱敏或合成且不改变 Token 统计。

**可以这样答：**

> 回放集应保留输入输出 Token 长度、到达间隔、租户优先级、取消率、工具停顿和共享前缀等负载特征。原文使用合规脱敏或生成等价 Token 分布的合成内容，不能因全部替成短占位符破坏真实性。固定随机种子和服务配置，分别运行开环到达与闭环并发，报告过载时的排队行为。定期更新分布版本，同时保留历史回放集用于性能回归对比。

## 常见追问

1. **固定并发压测为什么不够？** 它无法复现突发到达和队列积压，可能高估系统在真实峰值下的稳定性。
2. **输出长度如何回放？** 可通过固定生成上限、终止模式或模拟分布控制，并记录实际差异。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
