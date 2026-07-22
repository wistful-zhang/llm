---
title: '对称量化和非对称量化有什么区别，LLM 权重为什么常用对称量化？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '对称量化'
  - 'Zero Point'
  - '权重'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

解释零点是否固定为零、分布利用率和硬件实现复杂度。

**可以这样答：**

> 对称量化把浮点零映射到整数零，只需 scale，适合大致以零为中心的权重分布。非对称量化额外使用 zero point，可更充分覆盖偏移分布，但计算和 kernel 处理更复杂。LLM 权重通常正负分布较对称，因此低比特部署常选对称方案。激活可能明显非对称，是否使用 zero point 要结合校准误差与硬件支持。

## 常见追问

1. **对称量化一定浪费一个整数值吗？** 有符号整数范围可能不完全对称，但实现常接受这点换取零点简单。
2. **Zero point 可以按组设置吗？** 可以，但元数据和计算更复杂，并非所有高性能 kernel 支持。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
