---
title: 'GPU 推理变慢时，应该怎样联合解读利用率、显存带宽、功耗和时钟？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'GPU 监控'
  - 'Profiling'
  - '时钟'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明单个利用率指标不足，要与 kernel 时间线、温度降频和流量形状相关联。

**可以这样答：**

> GPU Util 高只表示设备在忙，不能区分算力、带宽或低效 kernel。需要同时看 Tensor Core、显存吞吐、SM 占用、功耗、温度和实际时钟，并与请求长度和 Batch 时间线对齐。功耗或温度限制可能触发降频，表现为同样负载下 kernel 变慢。持续异常再用 Profiler 下钻到算子，避免仅凭监控面板猜原因。

## 常见追问

1. **显存占满说明服务高效吗？** 不说明，可能是 KV 预留、碎片或无用缓存，需看有效利用和吞吐。
2. **为什么空闲时钟也可能很高？** 驱动的性能状态和最近负载会影响时钟，必须结合功耗与 kernel 活动判断。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
