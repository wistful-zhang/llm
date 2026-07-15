---
title: "线上大模型应用应该观测哪些指标，怎样做到可排障又不泄露数据？"
source: "公开 AI 工程面试题库；依据 OpenTelemetry 与推理框架文档原创整理"
review_status: "待复习"
category: "工程实践"
difficulty: "简单"
tags:
  - 可观测性
  - Tracing
  - 隐私
published: true
answer_status: complete
verified: true
date: 2026-07-13
---

## 面试时怎么答

可观测性应沿一条请求把网关排队、检索、Prefill、Decode、工具和后处理串成 Trace，再分别归入质量、可靠性、性能、成本与安全。每个 Span 要带模型、Prompt、索引版本；原文日志虽便于复现却有隐私风险，因此默认记录脱敏特征，高风险操作单独审计。

**可以这样答：**

> 线上观测可以分成五类：质量、可靠性、性能、成本和安全。一次请求要有 Trace ID，把网关排队、检索、模型 Prefill/Decode、工具调用和后处理串起来；版本信息必须包含模型、Prompt 与索引。但原文日志最好复现，但隐私风险最高，所以默认记录脱敏特征、内容哈希和结构化错误，高风险动作单独审计。线上还要看任务成功率、TTFT、TPOT、P95 端到端延迟、每成功任务成本、漂移告警和告警准确率。

## 核心回答

可观测性应覆盖三层：基础服务层看错误率、可用性、队列、TTFT、TPOT、吞吐、GPU 与 KV Cache；调用链层看网关、检索、重排、模型和工具各自耗时及重试；产品层看任务成功率、引用正确率、安全拦截、人工接管和每成功任务成本。每条链路携带 trace ID，并记录模型、Prompt、检索索引和工具 Schema 的版本，才能把质量变化定位到具体发布。

日志不应默认保存完整 Prompt 和回答。优先记录结构化元数据、长度、哈希和错误类型；确需内容排障时使用采样、脱敏、访问控制、短保留期与审计，并允许按数据政策删除。

## 展开说明

几个信号分别回答不同问题：

- **TTFT** 包含排队和 Prefill 影响，**TPOT** 更接近生成阶段的逐 token 体验，总延迟还受输出长度影响。
- 只看 GPU 利用率无法解释请求是否堆积，应同时看等待请求、等待 token、批大小和 KV 使用率。
- HTTP 200 不代表业务成功，格式校验失败、无依据回答和工具执行失败都应成为独立结果状态。
- 高基数字段不能随意作为指标标签；请求 ID、用户 ID 等适合放到受控日志或 Trace，否则会增加监控成本。

跨供应商时可以采用统一语义字段，再保留少量供应商特有属性，减少仪表盘和告警规则分裂。

## 工程实践

先定义 SLO 与错误预算，再从一次真实请求建立端到端 Trace：网关 span 下挂检索、模型、工具和校验 span。为延迟、token、错误与费用做按模型和版本的低基数聚合；对质量和安全做分层抽样评审。告警要指向可操作信号，例如“队列增长且 TTFT 超阈值”，而不是对每次模型拒答报警。

## 常见追问

1. **TTFT、TPOT 和端到端延迟各自说明什么？** TTFT 反映排队与 Prefill，TPOT 反映生成阶段节奏，端到端延迟还包含网关、检索、工具和后处理。
2. **为什么只监控 GPU 利用率不够？** 高利用率不等于高有效吞吐，也看不到质量、错误、排队、成本、显存碎片和外部依赖瓶颈。
3. **不保存原始 Prompt 时，如何复现线上问题？** 保存授权后的脱敏特征、模板与制品版本、采样参数、内容哈希和 Trace；必要时通过受控短期加密采样重现。

## 一句话复习

> 用版本化 Trace 串起服务、模型与业务结果，同时把内容日志当敏感数据最小化处理。

## 参考资料

- 面试题来源：[AI Engineering Interview Questions 的监控与追踪题](https://github.com/amitshekhariitbhu/ai-engineering-interview-questions)
- 官方依据：[OpenTelemetry GenAI 语义约定](https://opentelemetry.io/docs/specs/semconv/gen-ai/)、[vLLM Production Metrics](https://docs.vllm.ai/en/latest/usage/metrics/)
