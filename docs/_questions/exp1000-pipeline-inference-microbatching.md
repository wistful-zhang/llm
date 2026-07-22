---
title: 'Pipeline Parallel 做在线推理时，Microbatch 数量怎样影响 Bubble 和延迟？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
tags:
  - 'Pipeline Parallel'
  - 'Microbatch'
  - 'Bubble'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

解释更多 Microbatch 能填满流水线，但单请求等待和调度复杂度增加。

**可以这样答：**

> 流水线阶段在没有输入时会空闲，更多 Microbatch 能让不同阶段同时处理不同请求，降低 Bubble。为了凑足 Microbatch 而等待会增加 TTFT，每个微批太小又让 kernel 利用率下降。阶段计算量不均衡时，最慢阶段决定节拍，单纯增加微批无法解决。在线系统需按 SLO 设置短等待窗口，并将长短请求分桶减少阶段间抖动。

## 常见追问

1. **Decode 每步都要走完整流水线吗？** 是，每个新 Token 依次经过各阶段，阶段间还要传递激活。
2. **层数不能均分怎么办？** 按实测计算与通信成本分配层，必要时对重层做更细并行。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
