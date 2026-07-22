---
title: '显存不足需要抢占请求时，重算 KV 和 Swap 到 CPU 怎么选？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '抢占'
  - 'KV Swap'
  - '重计算'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

比较 PCIe 传输、已生成长度、Prefill 重算成本和恢复延迟。

**可以这样答：**

> Swap 保存 KV，恢复时避免重算，但需要 CPU 内存和 PCIe 或 NVLink 传输，长 KV 迁移可能很慢。重算释放最彻底，只保存输入 Token，恢复时重新 Prefill，短上下文或高速计算时可能更划算。调度器可根据当前 KV 大小、总 Prompt 长度、链路带宽和预计等待时间动态选择。高优先请求还要限制被反复抢占，避免饥饿和无效往返。

## 常见追问

1. **NVMe Offload 适合在线抢占吗？** 容量大但延迟更高，通常适合长时间暂停或批任务，不适合频繁交互恢复。
2. **抢占后用户连接怎么办？** 保持流状态并发送心跳或明确等待状态，超过 SLO 时可取消或降级。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
