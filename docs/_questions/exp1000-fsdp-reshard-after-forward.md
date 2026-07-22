---
title: 'FSDP 的 reshard_after_forward 应该怎样取舍？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '困难'
tags:
  - 'FSDP'
  - 'Reshard'
  - '显存通信'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

比较前向后立即丢弃完整参数省显存，与反向前再次 All-Gather 的通信代价。

**可以这样答：**

> 开启 Reshard 会在单元前向完成后释放完整参数，只保留本地分片，显著降低后续激活叠加时的显存。反向计算该单元前需要再次 All-Gather 权重，因此通信增加。关闭则保留完整参数直到反向，速度可能更好但峰值高，常按模型大小、Checkpointing 和节点内存决定。

## 常见追问

1. **最外层和内层可以用不同策略吗？** 可以，部分实现允许针对不同 Wrap Unit 调整，以平衡峰值和重复通信。
2. **它会影响数值结果吗？** 理论上只是存储与通信策略，精度和通信顺序差异可能造成微小浮点变化。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
