---
title: "一个线上大模型应用通常包含哪些核心模块？"
source: "公开面经高频主题；答案依据论文和官方文档原创整理"
verified: true
review_status: "待复习"
category: "系统设计"
difficulty: "简单"
tags:
  - 系统架构
  - LLM 应用
  - 可观测性
published: true
date: 2026-07-13
---

## 核心回答

典型链路包括入口网关、身份与限流、业务编排、Prompt 和模型路由、RAG 或工具层、模型服务、输出校验与安全防护、状态和缓存，以及日志、Tracing、评估和反馈闭环。回答系统设计题时应先说明业务目标和 SLO，再解释哪些模块真的需要，而不是机械堆叠框架。

## 展开说明

一次请求可以这样流动：

1. 网关完成认证、租户识别、配额和请求大小检查。
2. 编排层加载版本化 Prompt、会话状态和业务规则。
3. 根据任务、成本和可用性选择模型，必要时调用检索或工具。
4. 对结构化输出做 Schema 与业务校验，对高风险动作增加确认。
5. 把响应流式返回，同时记录 token、耗时、模型版本、检索证据和工具结果。

模型不应直接持有数据库管理员权限。外部系统通过受限工具接口暴露，并在执行前后验证权限和真实状态。

## 工程实践

第一版可以是单体应用，但接口边界和观测字段应先设计好。只有当吞吐、团队协作或隔离需求出现时再拆服务。核心 SLO 通常包括可用性、TTFT、总延迟、任务成功率和单请求成本。

## 常见追问

1. 模型路由和降级应该放在哪一层？
2. 哪些数据适合缓存，哪些不能缓存？
3. 如何记录工具调用而不泄漏敏感信息？

## 一句话复习

> 线上 LLM 应用是受控的软件系统：模型只是其中一个模块，权限、校验和观测同样重要。

## 参考资料

- 面试主题：[LLM System Design Interview Guide](https://www.systemdesign.academy/llm-system-design)
- 工程依据：[Anthropic：Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)、[OWASP Secure AI Model Ops](https://cheatsheetseries.owasp.org/cheatsheets/Secure_AI_Model_Ops_Cheat_Sheet.html)
