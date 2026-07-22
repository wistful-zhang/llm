---
title: 'Token 生成速度快于内容审核或客户端消费时，系统怎样做背压？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '背压'
  - '流式生成'
  - '缓冲区'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

回答有界缓冲、暂停读取、调度降速与超时取消，避免无界队列。

**可以这样答：**

> 每段链路使用有界缓冲并暴露消费进度，审核或网络变慢时上游停止继续读取或降低该请求调度频率。缓冲接近上限可合并 Token，但不能无限堆在内存中。持续慢消费者达到阈值后主动断开并取消推理，释放 GPU 资源。指标区分模型生成、审核和网络等待，才能知道背压来自哪里。

## 常见追问

1. **暂停读取能让 GPU 停止该请求吗？** 需要推理引擎支持请求级调度或取消，仅靠 TCP 背压可能仍在后台生成。
2. **审核为什么不逐 Token 做？** 单 Token 缺少语义且开销高，常用短文本块并在展示前保持小型安全缓冲。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
