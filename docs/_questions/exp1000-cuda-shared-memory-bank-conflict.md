---
title: 'Shared Memory Bank Conflict 是怎样产生的？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '困难'
tags:
  - 'CUDA'
  - 'Shared Memory'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

组织答案时围绕“共享内存 Bank 冲突”展开：把定义或机制讲清楚，用具体例子验证，并说明广播同一地址可能被硬件优化，Bank 数和映射也依架构而异。

**可以这样答：**

> 核心判断是，同一 Warp 多线程访问落到同一 Bank 的不同地址时需串行处理，适当 Padding 或重排索引可减少冲突。实际验证可采用这个办法：在矩阵转置 tile 中比较有无额外一列 Padding。此外，广播同一地址可能被硬件优化，Bank 数和映射也依架构而异。

## 常见追问

1. **不铺背景，直接说明“共享内存 Bank 冲突”的核心机制或判断。** 同一 Warp 多线程访问落到同一 Bank 的不同地址时需串行处理，适当 Padding 或重排索引可减少冲突
2. **把“共享内存 Bank 冲突”落到一个可检查的例子，你会怎么做？** 在矩阵转置 tile 中比较有无额外一列 Padding
3. **什么情况下不能直接套用“共享内存 Bank 冲突”？** 广播同一地址可能被硬件优化，Bank 数和映射也依架构而异

## 延伸阅读

- [NVIDIA CUDA C++ Programming Guide](https://docs.nvidia.com/cuda/cuda-c-programming-guide/)
