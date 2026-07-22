---
title: 'memory_allocated 与 memory_reserved 为什么不同？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '中等'
study_tier: 'archive'
tags:
  - 'PyTorch'
  - 'CUDA Memory'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

口述“PyTorch CUDA 内存统计”时，先回答它是什么或怎么做，再用例子落地，最后交代适用限制：empty_cache 只释放未使用缓存，不会释放仍被引用的 Tensor。

**可以这样答：**

> allocated 是活跃 Tensor 占用，reserved 是缓存分配器向 CUDA 保留的内存，二者差值可供框架复用。例如，逐步创建删除 Tensor 并记录 allocated、reserved 和峰值。需要注意的是，empty_cache 只释放未使用缓存，不会释放仍被引用的 Tensor。

## 常见追问

1. **请用自己的话说明“PyTorch CUDA 内存统计”的核心做法。** allocated 是活跃 Tensor 占用，reserved 是缓存分配器向 CUDA 保留的内存，二者差值可供框架复用
2. **你准备怎样举例证明自己理解“PyTorch CUDA 内存统计”？** 逐步创建删除 Tensor 并记录 allocated、reserved 和峰值
3. **使用“PyTorch CUDA 内存统计”前还要确认什么？** empty_cache 只释放未使用缓存，不会释放仍被引用的 Tensor

## 延伸阅读

- [NVIDIA CUDA C++ Programming Guide](https://docs.nvidia.com/cuda/cuda-c-programming-guide/)
