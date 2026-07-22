---
title: '短请求和超长生成混在一起时，调度器怎样兼顾吞吐与公平？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
tags:
  - '公平调度'
  - '长短请求'
  - '饥饿'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明纯 FCFS 与纯短作业优先的缺陷，提出 Token 配额和老化机制。

**可以这样答：**

> FCFS 让短请求被前面的长请求阻塞，纯短作业优先又可能让长请求永远得不到资源。可以按每轮 Token 预算做加权公平调度，为交互流量和批任务设置队列，同时用等待时间老化提升长期未服务请求的优先级。已开始生成的请求保持最小进度，减少频繁抢占。评估同时看各长度桶的 P99、完成率和系统 Goodput。

## 常见追问

1. **按预计输出长度调度可靠吗？** 只能作为估计，用户 max_tokens 常高于实际，需要在线更新剩余长度预测。
2. **VIP 请求可以无限优先吗？** 不应，仍要设权重和配额，避免普通租户饥饿与容量失控。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
