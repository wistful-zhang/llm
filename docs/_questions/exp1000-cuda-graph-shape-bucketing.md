---
title: '动态 Batch 和长度下，怎样通过 Shape Bucketing 提高 CUDA Graph 命中？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'CUDA Graph'
  - 'Shape Bucket'
  - '动态形状'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明为常见形状预捕获 Graph，运行时 Padding 到最近桶，并权衡内存与浪费。

**可以这样答：**

> CUDA Graph 适合固定执行图和内存地址，动态形状会导致频繁回退。可根据线上 Batch、Token 数和模型并行形状选择少量高频桶，预分配缓冲并捕获对应 Graph。请求运行时填充到不小于实际的最近桶，桶太稀会浪费计算，太多又增加捕获时间和常驻显存。监控各桶命中率与 Padding 比例，长尾形状走普通 eager 路径。

## 常见追问

1. **为什么 Graph 会额外占显存？** 多个形状需要独立静态缓冲和捕获状态，数量过多会挤压 KV Cache。
2. **模型输出长度动态影响 Graph 吗？** 每个 Decode 步形状可按当前活跃批桶化，序列结束会改变下一步批形状。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
