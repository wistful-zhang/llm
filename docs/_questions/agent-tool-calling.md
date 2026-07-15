---
title: "LLM 的 Tool Calling 是怎样工作的？"
source: "Datawhale 公开真实面试题整理；答案依据原论文原创整理"
review_status: "待复习"
category: "Agent"
difficulty: "简单"
tags:
  - Tool Calling
  - Function Calling
  - JSON Schema
published: true
verified: true
date: 2026-07-13
---

## 面试时怎么答

按一次完整调用链回答：应用把工具描述和 Schema 交给模型，模型选择工具并生成参数，应用校验后执行，再把结果回填。要特别区分“结构合法”和“业务安全”，Schema 只能解决前者。继续追问时可用订单查询或退款举例，说明授权、幂等、错误分类和结果校验分别放在哪一层。

**可以这样答：**

> Tool Calling 的流程是：应用向模型提供工具名称、用途和参数 Schema，模型输出工具选择与参数；应用先做结构、权限和业务规则校验，执行真实工具后，再把结果作为新消息交给模型生成后续回答。Schema 只能保证字段形状，不能证明调用有权限或金额合理，所以安全校验和副作用控制必须由应用与工具服务端完成。

## 核心回答

Tool Calling 不是模型直接执行函数，而是模型根据工具名称、描述和参数 Schema 生成一份结构化调用建议。应用侧解析并校验工具名、参数、权限和当前状态，真正执行函数后，再把结果作为工具消息交回模型继续推理或生成答案。模型负责提出动作，可信执行器负责决定动作能否执行。

## 展开说明

一轮调用通常包括：

1. 应用把可用工具及参数约束放入模型上下文。
2. 模型判断是否需要工具，并生成 tool name、arguments 和 call id。
3. 编排器做 Schema、类型、枚举、资源权限及业务前置条件校验。
4. 工具在受限身份下执行，返回结构化结果或明确错误。
5. 结果与 call id 回填，模型据此继续调用、追问或结束。

JSON Schema 只能约束结构，不能证明参数符合用户意图。例如合法的 account_id 仍可能属于其他用户。对于付款、发送和删除等操作，还要使用幂等键、确认步骤和执行后状态核验。

## 工程实践

工具描述应短而明确，区分相似工具并写清何时不能调用。不要把数据库管理员凭证交给模型；执行器按用户身份签发最小权限。记录工具名、规范化参数、耗时、错误类型和结果摘要，但避免把密钥及不必要的敏感数据写入上下文或日志。

## 常见追问

1. **Function Calling 与普通结构化输出有什么区别？** 两者都可产出结构化数据，但 Function Calling 把输出放进明确的工具协议与调用生命周期；实际执行仍由应用决定。
2. **参数通过 JSON Schema 后为什么仍要做权限校验？** Schema 只验证类型、必填项和格式，无法判断当前用户是否有权操作该账户、金额或资源。
3. **多个工具名称相似时如何降低误选率？** 使用互斥且具体的名称和描述，减少重叠参数，提供正反例，并在高风险调用前加入意图与权限确认。

## 一句话复习

> 模型只提出结构化工具调用，服务端必须在可信边界内校验、执行并反馈结果。

## 参考资料

- 面经主题：[Datawhale 真实面试题中的 Tool Use 与 Function Calling](https://github.com/datawhalechina/hello-agents/blob/main/Extra-Chapter/Extra01-%E9%9D%A2%E8%AF%95%E9%97%AE%E9%A2%98%E6%80%BB%E7%BB%93.md)
- 技术依据：[Toolformer](https://arxiv.org/abs/2302.04761)、[OWASP AI Agent Security](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html)
