---
title: "MCP 的 Host、Client、Server 如何协作，安全边界在哪里？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
verified: true
review_status: "待复习"
category: "Agent"
difficulty: "中等"
study_tier: "core"
tags:
  - MCP
  - 协议
  - 安全边界
published: true
answer_status: complete
date: 2026-07-14
---

## 面试时怎么答

MCP 题最容易把协议角色和安全责任混在一起。回答时分别说明 Host、Client、Server：Host 掌握用户交互和授权，Client 维护与某个 Server 的会话，Server 暴露资源或工具。能力协商不等于业务授权，这句话一定要说。继续追问时再谈最小权限、结果隔离和不可信工具描述。

**可以这样答：**

> MCP 中，Host 是承载用户交互、模型和策略的应用；Client 代表 Host 与某个 MCP Server 建立会话；Server 声明并执行资源、提示或工具能力。初始化阶段的能力协商只说明双方支持什么，并不授予业务权限。Host 仍需校验调用意图和参数，Server 也要按调用者身份做授权，并把外部返回内容视为不可信数据。

## 核心回答

MCP（Model Context Protocol）把 AI 应用接入外部数据与能力的方式标准化。Host 是承载模型和用户体验的应用；Host 为每个 MCP Server 建立 Client 连接；Server 暴露能力。常见 Server 能力包括 Resources、Prompts 与 Tools：Resources 提供可读取的上下文，Prompts 提供可复用模板，Tools 表示可产生计算或副作用的操作。协议使用 JSON-RPC 消息，并在初始化阶段协商协议版本与双方能力。

安全边界不能简化成“Server 返回的内容都可信”。Host 应掌握连接、授权、用户同意、上下文选择与模型调用；Server 只能获得完成其功能所需的最小权限。工具描述、资源内容和采样请求都可能是不可信输入，尤其不能因为它们来自 MCP Server 就绕过 Prompt Injection 防护、参数校验或高风险操作确认。

## 展开说明

一条典型链路是：Host 启动或连接 Server，Client 与 Server 完成 `initialize` 和能力协商，随后列举或读取资源、获取 Prompt、调用 Tool，并用通知同步状态。Client 与 Server 是一对一协议会话；一个 Host 可以同时管理多个 Client，但不应默认把一个 Server 的数据或凭据转交给另一个 Server。

能力方向也很重要：Server 向 Client 暴露 Resources、Prompts、Tools，并可声明 Logging 等能力；Client 可声明 Roots、Sampling 与 Elicitation 等能力。Logging 的方向是 Server 向 Client 发结构化日志、Client 可设置最低日志级别，并不是 Client capability。Server 发起 Sampling 不代表它有权决定最终发送给模型的全部上下文，Host 仍应检查请求、限制模型和 token 预算，并决定是否要求用户确认。

MCP 是版本化协议。字段、能力和授权扩展会演进，因此实现必须使用初始化协商出的版本，未知能力采用安全默认值。本题描述以参考资料所链接的协议版本为准，不能把某个 SDK 的便捷行为误认为所有版本都保证的协议语义。

## 工程实践

维护 Server 允许列表、能力清单与凭据作用域，为每次 Tool Call 记录 Server 身份、参数摘要、授权主体和结果状态。对读、写、外部发送、支付等能力分级；高风险调用在执行前展示可理解的参数并要求确认。限制资源大小、重定向、网络目的地和调用超时，验证 Tool 的结构化输入输出，并把 Server 返回文本继续视为不可信数据。升级协议或 SDK 时，用握手、取消、错误码和权限拒绝场景做兼容回归。

## 常见追问

1. **Host 与 Client 是同一个东西吗？** 不是。Host 是完整应用及安全决策主体，Client 是 Host 内与某一个 Server 维持协议会话的组件。
2. **Tool、Resource 和 Prompt 有什么区别？** Tool 表示可调用操作，Resource 表示可读取上下文，Prompt 表示可复用交互模板；三者的权限和副作用不同。
3. **MCP Server 可以直接看到所有对话吗？** 不应默认可以。Host 应只发送该请求所需的数据，具体可见范围由应用实现与用户授权决定。
4. **版本不一致怎么办？** 初始化时协商双方支持的协议版本与能力；无法安全兼容时应拒绝连接，而不是猜测字段语义。

## 一句话复习

> MCP 用 Host 管理多条 Client–Server 会话并标准化上下文与工具接入，但授权、用户同意和跨 Server 数据隔离始终由 Host 把关。

## 参考资料

- [Model Context Protocol：Specification](https://modelcontextprotocol.io/specification/latest)
- [Model Context Protocol：Architecture](https://modelcontextprotocol.io/docs/learn/architecture)
