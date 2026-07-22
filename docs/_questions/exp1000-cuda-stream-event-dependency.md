---
title: 'CUDA Stream 与 Event 怎样表达异步依赖？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '困难'
study_tier: 'archive'
tags:
  - 'CUDA'
  - '异步执行'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

口述“CUDA 流与事件”时，先回答它是什么或怎么做，再用例子落地，最后交代适用限制：主机异步返回不代表操作完成，Tensor 生命周期必须覆盖实际执行。

**可以这样答：**

> 同一 Stream 保序，不同 Stream 可并发；Event 可记录完成点并让另一 Stream 等待，而不必同步整个设备。一个直接的检查办法是：让拷贝与计算分流并用 Event 建立正确依赖。这个结论的边界是，主机异步返回不代表操作完成，Tensor 生命周期必须覆盖实际执行。

## 常见追问

1. **请用自己的话说明“CUDA 流与事件”的核心做法。** 同一 Stream 保序，不同 Stream 可并发；Event 可记录完成点并让另一 Stream 等待，而不必同步整个设备
2. **你准备怎样举例证明自己理解“CUDA 流与事件”？** 让拷贝与计算分流并用 Event 建立正确依赖
3. **使用“CUDA 流与事件”前还要确认什么？** 主机异步返回不代表操作完成，Tensor 生命周期必须覆盖实际执行

## 延伸阅读

- [NVIDIA CUDA C++ Programming Guide](https://docs.nvidia.com/cuda/cuda-c-programming-guide/)
