---
title: "如何让大模型稳定输出结构化数据，并安全地驱动业务动作？"
source: "公开 AI 工程面试题库；依据 JSON Schema 与模型官方文档原创整理"
review_status: "待复习"
category: "工程实践"
difficulty: "中等"
tags:
  - Structured Outputs
  - JSON Schema
  - 工具调用
published: true
verified: true
date: 2026-07-13
---

## 核心回答

优先使用模型或服务端支持的 Schema 约束解码，明确字段类型、枚举、必填项和是否允许额外字段；收到结果后仍要做 JSON Schema 校验和独立的业务校验。Schema 只能提高结构符合度，不能证明字段内容真实、用户有权限，或某个操作应该执行。真正的业务动作必须在可信代码中做鉴权、参数边界检查、幂等和审计，高风险动作还应二次确认。

还要显式处理拒答、内容截断、Schema 不支持、超时和供应商错误。重试应有次数上限并携带幂等键，不能把“再次让模型修 JSON”当成无限循环。

## 展开说明

完整链路可以分成四道边界：

1. **生成约束**：用支持范围内的 Schema 限制候选 token，减少语法和类型错误。
2. **结构校验**：验证必填字段、类型、枚举、长度和额外属性，区分不可解析与不合 Schema。
3. **语义校验**：检查日期范围、资源是否存在、金额关系等模型不了解的实时业务规则。
4. **执行授权**：根据登录用户和当前状态重新鉴权，工具只暴露最小权限，副作用操作使用幂等键。

Schema 应保持小而清晰。一次要求巨大且深层嵌套的对象会增加生成成本与失败面；可以把“识别意图”和“执行参数补全”拆成可观测的两步。

## 工程实践

为 Schema 本身建立版本号和兼容策略，在 Trace 中记录 Schema 版本、校验失败路径、模型版本和终止原因。测试集应包含缺字段、超长值、错误枚举、拒答、截断以及恶意字符串；只有在确定调用没有产生副作用时才自动重试。向前端渲染模型字符串时仍需正确转义，避免把合法 JSON 中的内容当可信 HTML。

## 常见追问

1. 结构化输出已经符合 Schema，为什么还要做业务校验？
2. Function Calling 和普通 JSON 输出的安全边界有何不同？
3. Schema 升级时怎样避免旧客户端或旧任务失败？

## 一句话复习

> Schema 负责约束形状，可信业务代码负责校验含义、权限与副作用。

## 参考资料

- 面试题来源：[AI Engineering Interview Questions 的 Structured Output 题](https://github.com/amitshekhariitbhu/ai-engineering-interview-questions)
- 官方依据：[OpenAI Structured Outputs 指南](https://developers.openai.com/api/docs/guides/structured-outputs)、[JSON Schema 2020-12 Core](https://json-schema.org/draft/2020-12/json-schema-core)
