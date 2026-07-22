---
title: '用户点击停止生成后，取消信号怎样贯穿网关、队列、模型和工具？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '困难'
tags:
  - '取消'
  - '资源回收'
  - '分布式系统'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 request_id、取消令牌、协作式检查和副作用边界，不能只断开前端连接。

**可以这样答：**

> 入口为任务生成 request_id 和可传播的 cancellation token，断连或用户停止时写入取消状态并通知下游。队列移除未执行任务，推理调度器在安全边界停止 Decode 并释放 KV，工具调用则按能力尝试取消。已经提交的副作用不能假装撤销，应查询状态并提示用户。所有服务使用幂等取消和最终状态，防止取消与完成并发造成双重通知。

## 常见追问

1. **HTTP 请求断开就等于取消吗？** 不一定，代理断开可能未传播到后台，必须有显式取消机制和截止时间。
2. **模型正在一个 GPU Kernel 中能立刻停吗？** 通常要等到可调度边界，取消延迟取决于 kernel 和引擎实现。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
