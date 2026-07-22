---
title: 'Stochastic Rounding 为什么有助于低精度训练？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '困难'
tags:
  - 'Stochastic Rounding'
  - '低精度'
  - '优化'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明按邻近浮点距离随机舍入可让期望无偏，避免小更新长期被抹掉。

**可以这样答：**

> 确定性舍入会把低于当前 ULP 的小更新反复舍成零，造成系统性停滞。Stochastic Rounding 按数值距上下邻点的比例随机选择，使舍入结果期望接近原值，小更新可在多步中累积。它增加随机性和硬件要求，复现时必须控制随机状态并确认算子真正支持。

## 常见追问

1. **它能替代 FP32 Master Weight 吗？** 在部分低精度训练方案中可减少依赖，但稳定性仍需按优化器和硬件验证。
2. **为什么推理通常不需要？** 推理没有持续累积微小参数更新，确定性和速度更重要。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
