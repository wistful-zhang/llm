---
title: '请设计一个统一的大模型 API Gateway，需要负责哪些事情？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '困难'
tags:
  - 'API Gateway'
  - '模型路由'
  - '治理'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

按认证配额、统一协议、路由、策略和观测回答，并避免网关承担全部业务逻辑。

**可以这样答：**

> 网关验证租户身份，执行请求大小、Token 配额、速率与风险策略，再把统一请求转换为目标供应商协议。路由依据能力、地区、成本和健康状态，重试只针对安全错误，并保留模型与 Prompt 版本。流式响应、取消、用量结算和错误映射要有一致语义。业务级 RAG 与工具编排应放在上层服务，避免网关变成不可维护的巨型应用。

## 常见追问

1. **网关能否记录完整 Prompt？** 默认不应，按字段分级记录脱敏元数据，原文只在授权调试流程短期采样。
2. **供应商返回 429 怎么处理？** 遵循退避和配额策略，可路由到已批准备选模型，但不能无限重试。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
