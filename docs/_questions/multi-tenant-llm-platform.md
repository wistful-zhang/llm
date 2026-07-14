---
title: "如何设计多租户大模型平台的权限、成本与可观测性？"
source: "公开面经高频主题；答案依据论文和官方文档原创整理"
verified: true
review_status: "待复习"
category: "系统设计"
difficulty: "困难"
tags:
  - 多租户
  - 权限
  - 成本治理
published: true
date: 2026-07-13
---

## 核心回答

服务端必须从已验证的登录凭证推导并绑定 tenant_id 和用户身份，不能信任请求体或模型返回的身份字段。该身份贯穿网关、检索、工具、缓存和计费；权限使用最小授权和资源级校验；成本按模型、输入输出 token、工具与存储归集，设置租户配额和预算告警；可观测性按租户关联质量、延迟、错误和费用。隔离强度应根据租户互信程度选择共享、逻辑隔离或专属资源。

## 展开说明

设计时至少覆盖：

1. **身份与数据**：每次检索和工具调用都在服务端校验资源所有权、ACL 或行级权限；向量、会话、记忆和缓存键都带租户命名空间，但 Namespace 只是组织方式，不能单独充当授权边界。
2. **密钥与模型**：租户密钥使用独立密钥管理和轮换，模型、LoRA Adapter 与 Prompt 版本有明确授权。
3. **资源与成本**：按 token 和 GPU 时间计量，使用配额、并发上限、优先级和 Budget Kill Switch 防止失控。
4. **观测与审计**：Trace 包含模型版本、检索与工具步骤；密钥不得进入 Trace，PII 应最小化采集、脱敏并配置访问控制和保留期限。高风险操作保留追加写、防篡改或可验证完整性的审计记录。

共享资源成本低，但需要处理噪声邻居和数据泄漏风险；高敏租户可能需要独立索引、实例甚至集群。

## 工程实践

权限测试要覆盖横向越权、缓存串租户、日志泄漏和被 Prompt Injection 诱导的工具调用。故障演练应确认单个租户的流量尖峰、错误配置或预算耗尽不会拖垮其他租户。

## 常见追问

1. Namespace 隔离是否等于安全隔离？
2. 如何防止语义缓存把 A 租户答案返回给 B 租户？
3. 怎样把一次 Agent 任务的真实成本归集到租户？

## 一句话复习

> 多租户平台必须让身份贯穿数据、执行、缓存和计费，并按风险选择足够强的隔离边界。

## 参考资料

- 面试主题：[LLM System Design Interview Guide](https://www.systemdesign.academy/llm-system-design)
- 官方资料：[AWS 多租户 Agent 平台指导](https://docs.aws.amazon.com/prescriptive-guidance/latest/strategy-operationalizing-agentic-ai/focus-areas-multitenancy.html)、[Kubernetes 多租户](https://kubernetes.io/docs/concepts/security/multi-tenancy/)、[Azure 文档级访问控制](https://learn.microsoft.com/en-us/azure/search/search-document-level-access-overview)、[OpenTelemetry 语义约定](https://opentelemetry.io/docs/specs/semconv/)
