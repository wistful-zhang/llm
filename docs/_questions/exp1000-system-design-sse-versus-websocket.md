---
title: '大模型流式回答使用 SSE 还是 WebSocket，架构上怎么选？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'SSE'
  - 'WebSocket'
  - '流式协议'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

按单向文本流、双向实时控制、基础设施兼容和重连语义比较。

**可以这样答：**

> SSE 基于 HTTP，适合服务端到客户端的文本流，代理和浏览器支持通常更简单，也自带事件 ID 与重连思路。WebSocket 支持持续双向消息，适合实时语音、频繁控制和多人协作，但连接状态、扩容和网关配置更复杂。普通聊天可用 HTTP 发请求加 SSE 收流，取消另走 HTTP；复杂双向媒体再选择 WebSocket。无论哪种，都要定义心跳、断线、重复事件和鉴权续期。

## 常见追问

1. **SSE 能发送二进制音频吗？** 不适合高效二进制流，通常改用 WebSocket、WebRTC 或独立媒体通道。
2. **重连后怎样不重复显示 Token？** 事件带单调序号，客户端从最后确认位置续传并去重。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
