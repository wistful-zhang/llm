---
title: '手写 Triton Vector Add 时为什么要使用 Mask？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '中等'
study_tier: 'archive'
tags:
  - 'Triton'
  - 'Kernel'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

组织答案时围绕“Triton 边界 Mask”展开：把定义或机制讲清楚，用具体例子验证，并说明Mask 保证边界安全但不自动优化 block 大小和内存布局。

**可以这样答：**

> 核心判断是，Program 按 block 生成一组偏移，最后一块常超出长度，load 与 store 用 offset 小于 n 的 mask 防越界。实际验证可采用这个办法：用非 block 整数倍长度对比有无 mask，并检查结果。此外，Mask 保证边界安全但不自动优化 block 大小和内存布局。

## 常见追问

1. **不铺背景，直接说明“Triton 边界 Mask”的核心机制或判断。** Program 按 block 生成一组偏移，最后一块常超出长度，load 与 store 用 offset 小于 n 的 mask 防越界
2. **把“Triton 边界 Mask”落到一个可检查的例子，你会怎么做？** 用非 block 整数倍长度对比有无 mask，并检查结果
3. **什么情况下不能直接套用“Triton 边界 Mask”？** Mask 保证边界安全但不自动优化 block 大小和内存布局

## 延伸阅读

- [NVIDIA CUDA C++ Programming Guide](https://docs.nvidia.com/cuda/cuda-c-programming-guide/)
