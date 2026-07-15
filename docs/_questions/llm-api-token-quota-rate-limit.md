---
title: "大模型 API 网关如何按 Token 做限流、配额、预留与用量结算？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "系统设计"
difficulty: "中等"
tags:
  - API Gateway
  - Token Quota
  - Rate Limiting
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

Token 配额题先指出 QPS 不能代表 LLM 负载，再把请求速率、输入输出 Token、并发和费用四个约束分开。讲清请求前预留、流式结束后按实际用量回补的账本过程，以及全额预留与乐观估算各自的利用率风险；追问可落到多租户公平和 429 重试。

**可以这样答：**

> LLM 网关不能只按 QPS 限流，因为一次请求可能消耗几十或几万 Token。我会同时限制请求、Token、并发和费用。请求前按输入和输出上限预留额度，流式结束、取消或超时后按实际用量结算回补。部署时用本地桶挡突发、全局配额保证租户公平，并监控 429 率、预算超用、估算误差、排队 P95 和每租户 Goodput。

## 核心回答

请求速率只能约束调用次数，无法反映 Prompt 长度、输出上限、模型成本和 GPU 服务时间。网关应维护多维限制：每秒请求、每分钟输入/输出或总 Token、最大在途并发、金额预算，以及按租户/模型/优先级的配额。局部限流可快速吸收单实例突发；全局限流或配额服务保证多网关副本共享同一预算。

Token 在请求前只能估计。常见流程是先用指定 Tokenizer 计算输入，结合允许的 `max_tokens` 或预测输出预留额度；服务流式返回时累计实际使用，正常完成、客户端取消、超时或失败后做 Commit/Release。预留操作需要请求幂等 ID，防止客户端重试被重复扣款，也要设置租约回收崩溃请求的额度。

## 展开说明

全额按最大输出预留最安全，但用户把上限设很大时会造成低利用率。可以按历史分位数预留并保留全局安全余量，接近预算时停止生成；高风险/付费场景仍可用保守预留。调度层要考虑不同长度请求的公平性，避免一个超长请求占满租户或整个服务队列。

超过限制时返回明确的 429 与可用的 Retry-After/重置时间；客户端重试应带抖动并遵守幂等语义，不能形成重试风暴。

## 工程实践

对突发、持续高流量、超长输出、断流、网关崩溃、重复请求和全局配额服务故障做测试。指标包括配额判断 P95、429 率、实际与预估 Token 误差、超卖/漏结算数、租约回收时间、各租户 Goodput、队列 P95 和账单差异。配额服务失败时采用明确的 Fail-open 或 Fail-closed 策略并按风险分级。

## 常见追问

1. **为什么只按 `max_tokens` 预留会浪费容量？** 大多数回答会在达到上限前结束，全额预留会锁住不会使用的额度；可用历史分位数与安全余量改善。
2. **客户端断开后额度怎样处理？** 取消下游生成，按已实际生成 Token 结算并释放余量；若进程崩溃，由带 TTL 的租约回收。
3. **本地限流与全局限流如何配合？** 本地桶低延迟地挡突发和滥用，全局服务维护跨副本租户配额；请求必须同时通过两层。

## 一句话复习

> Token-aware 网关用多维配额和“预留—实际结算—租约回收”管理可变工作量，并以全局公平为目标。

## 参考资料

- 面经主题：[公开 LLM 面试题主题汇总](https://github.com/llmgenai/LLMInterviewQuestions)
- 官方文档：[Envoy AI Gateway Usage-based Rate Limiting](https://aigateway.envoyproxy.io/docs/next/capabilities/traffic/usage-based-ratelimiting/)
- 官方文档：[Envoy Gateway Rate Limiting](https://gateway.envoyproxy.io/docs/concepts/rate-limiting/)
- 标准：[RFC 6585 — 429 Too Many Requests](https://www.rfc-editor.org/info/rfc6585)
