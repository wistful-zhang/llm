---
title: '有些模型为什么把 Attention 和 FFN 并行计算，而不是串行堆叠？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'Transformer Block'
  - '并行分支'
  - '架构设计'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明依赖路径缩短带来的速度收益，同时指出表示交互和训练配方会变化。

**可以这样答：**

> 串行结构让 FFN 依赖本层 Attention 的输出，而并行结构让两者读取同一归一化输入后一起写回残差流。这样能缩短关键依赖路径，并在部分硬件和编译器上提高并行度。代价是本层 FFN 不能立即处理本层刚聚合的信息，通常需要靠后续层和重新调参弥补。

## 常见追问

1. **并行结构一定更快吗？** 不一定，收益取决于算子调度、通信重叠、批量和硬件利用率。
2. **残差相加前需要缩放吗？** 深模型中常需控制两个分支的输出尺度，避免叠加后方差持续增长。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
