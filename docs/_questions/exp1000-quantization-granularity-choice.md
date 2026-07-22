---
title: '量化里的 Per-tensor、Per-channel 和 Group-wise 有什么取舍？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '量化粒度'
  - 'Scale'
  - 'INT4'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明粒度越细越能适应分布差异，但元数据和 kernel 复杂度增加。

**可以这样答：**

> Per-tensor 为整个张量使用一个 scale，元数据少、实现简单，但容易被少数离群值拉大范围。Per-channel 通常按输出通道量化，能更好保留各通道精度。Group-wise 把若干连续权重共享 scale，是低比特权重量化常见折中，组越小通常误差越低但 scale 开销和解量化复杂度越高。选择必须匹配硬件 kernel 支持，并用端到端任务验证。

## 常见追问

1. **Group size 越小越好吗？** 不一定，精度可能提高，但存储、带宽和 kernel 效率会变差。
2. **激活也适合 Per-channel 吗？** 视算子和硬件而定，动态激活分布让细粒度 scale 计算成本更高。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
