---
title: 'GPTQ 和 AWQ 都做低比特权重量化，它们关注点有什么不同？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
tags:
  - 'GPTQ'
  - 'AWQ'
  - 'Weight-only'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 GPTQ 的逐层误差补偿与 AWQ 的激活感知显著权重保护，再落到工具链选择。

**可以这样答：**

> GPTQ 通常利用近似二阶信息逐层量化，并在处理权重时补偿量化误差。AWQ 观察激活分布，识别对输出更重要的权重通道，通过缩放等方式保护它们。两者都常用于 Weight-only INT4，但具体格式、校准成本和运行时 kernel 不同。选择时应在同一模型、组大小和推理引擎上比较质量、转换时间、显存与吞吐。

## 常见追问

1. **哪一个一定更准？** 没有通用结论，模型架构、任务、实现和量化配置都会影响结果。
2. **量化文件格式能互换吗？** 通常不能直接互换，scale、排列和 kernel 期望不同，需要对应转换工具。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
