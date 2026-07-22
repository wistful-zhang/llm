---
title: '给定 Tensor Shape 和 dtype，怎样手算一次算子的最低显存？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '中等'
tags:
  - 'CUDA'
  - '显存估算'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

组织答案时围绕“Tensor 显存计算”展开：把定义或机制讲清楚，用具体例子验证，并说明最低静态和实际峰值不同，异步生命周期与算法 workspace 会抬高峰值。

**可以这样答：**

> 这件事可以概括为：元素数量乘每元素字节得到张量大小，再加输入、输出、临时 workspace、对齐和框架缓存。落到实验或实现上，为矩阵乘前向列出各 Tensor 和不同 dtype 的字节数。同时要确认，最低静态和实际峰值不同，异步生命周期与算法 workspace 会抬高峰值。

## 常见追问

1. **不铺背景，直接说明“Tensor 显存计算”的核心机制或判断。** 元素数量乘每元素字节得到张量大小，再加输入、输出、临时 workspace、对齐和框架缓存
2. **把“Tensor 显存计算”落到一个可检查的例子，你会怎么做？** 为矩阵乘前向列出各 Tensor 和不同 dtype 的字节数
3. **什么情况下不能直接套用“Tensor 显存计算”？** 最低静态和实际峰值不同，异步生命周期与算法 workspace 会抬高峰值

## 延伸阅读

- [NVIDIA CUDA C++ Programming Guide](https://docs.nvidia.com/cuda/cuda-c-programming-guide/)
