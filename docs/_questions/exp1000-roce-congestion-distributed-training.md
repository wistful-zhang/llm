---
title: 'RoCE 网络拥塞会怎样表现，训练侧可以做哪些排查？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'RoCE'
  - '网络拥塞'
  - 'NCCL'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明丢包重传、PFC Pause 和长尾延迟，并从链路计数器、流量隔离和拓扑检查。

**可以这样答：**

> RoCE 在以太网上承载 RDMA，对拥塞和无损配置敏感，异常时常表现为 Collective 长尾、吞吐抖动或偶发超时。应检查端口丢包、ECN、PFC Pause、队列和路径不对称，并确认训练流量没有与存储或其他作业争用。训练侧可调 NCCL 通道与网卡绑定，但根因若是 Fabric 拥塞仍需网络 QoS 和容量治理。

## 常见追问

1. **开启 PFC 就不会丢包了吗？** 它可减少丢包，但配置不当会产生 Head-of-Line Blocking 或 Pause Storm。
2. **为什么小规模测试正常、大规模才抖？** 并发流和 All-to-All 扇出上升后才会触发交换机缓冲与热点路径瓶颈。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
