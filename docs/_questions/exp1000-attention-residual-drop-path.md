---
title: '对整个 Attention 分支做 DropPath 时，残差期望怎样保持？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
tags:
  - 'DropPath'
  - 'Attention'
  - '正则化'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明训练时保留分支需除以 keep probability，推理时使用完整分支。

**可以这样答：**

> DropPath 按样本或批次随机丢弃完整残差分支，保留时通常除以保留概率 p，使训练期分支输出的期望与推理期一致。残差主路径始终存在，所以信息不会完全中断。深层可使用随深度增大的丢弃率，但过强会让高层训练不足并增加批间噪声。

## 常见追问

1. **为什么不在推理时也随机丢层？** 常规推理关闭随机性并用期望模型，若要做不确定性估计才会保留随机采样。
2. **按 Token 丢分支合理吗？** 可以但会破坏序列内一致性，且实现与缓存更复杂，常见做法按样本丢。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
