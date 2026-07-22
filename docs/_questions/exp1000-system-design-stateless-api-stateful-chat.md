---
title: '聊天产品怎样让推理 API 保持无状态，同时支持有状态多轮会话？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '无状态服务'
  - '会话'
  - '扩展性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明会话状态外置、每次构造有效上下文和乐观并发控制。

**可以这样答：**

> 推理 Worker 不保存用户会话，会话服务持久化消息、结构化状态和摘要。每次请求读取指定 revision，按策略选择历史、记忆和证据后构造完整模型输入，因此任一健康 Worker 都能处理。写回使用乐观并发避免两个终端覆盖，并将副作用操作单独幂等。热会话可缓存，但数据库仍是可恢复事实源，缓存丢失不会改变业务状态。

## 常见追问

1. **把全部会话放 Redis 可以吗？** 可做热层，但长期一致性、容量和恢复需要持久存储，不能把易失缓存当唯一事实源。
2. **消息删除后摘要怎么办？** 删除事件使相关摘要失效并重建，防止已删内容继续进入上下文。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
