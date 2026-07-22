---
title: 'DataLoader 的 num_workers、prefetch_factor 与 persistent_workers 怎样调？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '中等'
study_tier: 'archive'
tags:
  - 'PyTorch'
  - 'DataLoader'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

组织答案时围绕“PyTorch 数据加载并行”展开：把定义或机制讲清楚，用具体例子验证，并说明Worker 过多会争用 CPU、文件句柄和内存，随机 Seed 也需正确初始化。

**可以这样答：**

> Worker 并行预处理，预取隐藏 I/O，持久 Worker 减少每 Epoch 启动成本；应以 GPU 空闲和主机资源实测。例如，扫描 worker 数并记录数据等待、CPU、内存和 step time。需要注意的是，Worker 过多会争用 CPU、文件句柄和内存，随机 Seed 也需正确初始化。

## 常见追问

1. **不铺背景，直接说明“PyTorch 数据加载并行”的核心机制或判断。** Worker 并行预处理，预取隐藏 I/O，持久 Worker 减少每 Epoch 启动成本；应以 GPU 空闲和主机资源实测
2. **把“PyTorch 数据加载并行”落到一个可检查的例子，你会怎么做？** 扫描 worker 数并记录数据等待、CPU、内存和 step time
3. **什么情况下不能直接套用“PyTorch 数据加载并行”？** Worker 过多会争用 CPU、文件句柄和内存，随机 Seed 也需正确初始化

## 延伸阅读

- [PyTorch 官方文档](https://docs.pytorch.org/docs/stable/)
