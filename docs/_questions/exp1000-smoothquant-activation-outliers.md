---
title: 'SmoothQuant 怎样处理激活离群值，迁移缩放为什么不改变浮点结果？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'SmoothQuant'
  - '激活离群值'
  - 'W8A8'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明按通道把激活难度迁移到权重，并用相反缩放保持矩阵乘等价。

**可以这样答：**

> LLM 激活某些通道有很大离群值，直接 INT8 会让多数普通值量化分辨率不足。SmoothQuant 对激活通道除以缩放 s，同时把对应权重通道乘以 s，因此浮点矩阵乘积保持不变。这样激活范围更平滑，而较易量化的权重承担更多范围。超参数控制迁移强度，仍需校准数据和支持该变换的高效 W8A8 kernel。

## 常见追问

1. **为什么权重更容易承受离群值？** 权重是静态的，可按通道离线量化，而激活随每个 Token 变化更难精确处理。
2. **SmoothQuant 能用于 INT4 激活吗？** 思想可扩展，但更低比特误差显著，实际效果和 kernel 支持需单独验证。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
