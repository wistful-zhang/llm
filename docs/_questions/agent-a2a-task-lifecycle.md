---
title: "A2A 协议如何支持 Agent 发现、任务生命周期与跨系统协作？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
verified: true
review_status: "待复习"
category: "Agent"
difficulty: "困难"
tags:
  - A2A
  - Agent Interoperability
  - Task Lifecycle
published: true
answer_status: complete
date: 2026-07-14
---

## 面试时怎么答

回答时要先划清 A2A 的职责：它解决独立 Agent 系统之间的发现、通信和任务状态协作，不是模型内部的工具调用协议。沿 Agent Card、Message、Task、Artifact 走一遍长任务即可。第二轮通常会问超时重试和权限，此时补充幂等、认证、状态终态与回调防重放。

**可以这样答：**

> A2A 用 Agent Card 暴露远端 Agent 的能力和接入要求，用 Message 交换输入，用 Task 跟踪处理中、等待输入、完成或失败等状态，再用 Artifact 交付结果。它提供的是跨系统互操作契约，不会自动解决信任。真实接入仍要做身份认证、最小权限、幂等请求、回调防重放和任务超时处理。

## 核心回答

A2A（Agent2Agent）面向彼此独立的 Agent 应用，定义能力发现、消息交换、任务状态和产物传递的互操作契约。远端 Agent 可通过 Agent Card 描述身份、端点、能力与认证要求；调用方发送 Message，双方用 Task 跟踪有状态工作，并以 Artifact 交付文件、结构化结果或其他产物。长任务可以使用流式事件或异步通知观察状态变化。

协议解决“不同系统如何对话”，不替代内部规划器，也不自动建立信任。调用方仍需核验 Agent Card 来源、认证主体、数据范围和输出；服务方要做授权、限流、幂等与租户隔离。Task ID 是关联状态的标识，不应被当成访问凭证。

## 展开说明

Message 表达一次通信内容和角色，Part 承载文本、数据或文件；Task 表示可能跨多轮、可等待输入的工作单元；Artifact 是任务生成的稳定产物。并非每个请求都必须创建长期 Task，具体交互方式取决于任务是否需要状态、流式更新或后续补充输入。

跨组织协作常出现失败重试、重复提交和回调乱序。实现需要定义客户端请求标识、Task 状态转换和终态，消费端按版本或事件序号去重，不能因为网络超时就假定远端没有执行。对文件或 URL 产物还要检查类型、大小、完整性和访问期限。

A2A 是版本化规范，Agent Card 字段、绑定方式与扩展会演进。实现应声明并协商支持版本，对未知扩展采用安全失败策略。本题答案以参考资料链接所指向的规范版本为准。

## 工程实践

建立可信 Agent 注册表或验证 Agent Card 签名与域名，把能力声明与真实授权分开。为 Task 设置超时、取消、重试和保留策略，记录调用者、消息摘要、状态转换与 Artifact 校验结果。回调端验证认证和防重放，敏感数据使用最小必要 Part 传递。兼容测试覆盖任务等待输入、取消、重复请求、流中断和旧版本 Agent。

## 常见追问

1. **Agent Card 有什么作用？** 它用于发现 Agent 的能力、端点和交互要求，但能力声明本身不等于可信授权。
2. **Message、Task、Artifact 如何区分？** Message 是通信内容，Task 是有生命周期的工作状态，Artifact 是任务交付的结果对象。
3. **A2A 与 MCP 是一回事吗？** 不是。A2A 主要连接独立 Agent，MCP 主要标准化 AI 应用与上下文或工具 Server 的连接；二者可以组合。
4. **请求超时后能直接重发吗？** 需要幂等键或先查询 Task 状态，否则远端可能已执行，重发会造成重复副作用。

## 一句话复习

> A2A 用 Agent Card、Message、Task 和 Artifact 建立跨系统 Agent 协作契约，但身份、授权、幂等和数据治理仍由实现负责。

## 参考资料

- [Agent2Agent Protocol：Specification](https://a2a-protocol.org/latest/specification/)
