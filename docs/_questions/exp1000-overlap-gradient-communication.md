---
title: '怎样让梯度通信与 Backward Compute 真正重叠？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '困难'
tags:
  - '通信重叠'
  - 'Backward'
  - '分布式训练'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明梯度就绪即异步启动、使用独立 Stream，并以时间线而非配置开关验证。

**可以这样答：**

> 当后层梯度就绪后就应异步启动对应 Bucket 的 Collective，同时默认计算流继续反传更浅层。通信和计算要使用可并发的 Stream、避免隐式同步，Bucket 也要按就绪顺序与合适大小组织。是否重叠必须用 Profiler 时间线验证，因为网络拥塞、算子占满 GPU 或错误依赖都可能让“异步”实际串行。

## 常见追问

1. **计算很少时还能完全隐藏通信吗？** 不能，只有剩余反传时间足够长时，通信尾部才可能被覆盖。
2. **Tensor Core 计算会和 NCCL 抢资源吗？** 会共享 GPU 执行与内存带宽，重叠可能降低双方瞬时速度但缩短总时间。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
