---
title: "如何为大模型平台设计跨地域容灾与降级？"
source: "公开 LLM 系统设计面试题；依据云架构与 NIST 容灾文档原创整理"
review_status: "待复习"
category: "系统设计"
difficulty: "困难"
tags:
  - 多地域
  - RTO RPO
  - 灾难恢复
published: true
verified: true
date: 2026-07-13
---

## 核心回答

先按能力定义 RTO（多久恢复）和 RPO（最多丢多少数据），再选择 active-active、warm standby、pilot light 或备份恢复；不是所有组件都需要同一等级。网关和编排尽量无状态、跨区部署；会话、任务、配额和审计数据按其一致性要求复制；模型权重、容器和 Prompt 制品预先复制并校验；推理容量要考虑 GPU 申请与模型预热时间，不能只在故障后才创建空集群。

故障时优先保持安全和数据边界：可切备用地域或供应商，也可降级到较小模型、只读功能或异步排队。任何降级都不能绕过租户权限、数据驻留和内容安全策略。

## 展开说明

LLM 平台需要分别处理：

- **控制面**：配置、版本注册、配额和路由规则需要有权威来源，避免两个地域在网络分区时同时接受冲突发布。
- **请求状态**：流式响应中断通常难以从最后一个 token 无缝续传；应给客户端明确终止状态和可安全重试的请求 ID。
- **异步任务**：通过持久队列、租约和幂等副作用恢复；切区前避免两个 worker 同时拥有同一任务。
- **RAG 数据**：对象源文档、元数据和向量索引分开规划。索引可以从版本化源重建，但重建时间必须计入 RTO。
- **外部模型**：多供应商可减少单点故障，却会带来能力、Schema、安全和数据处理条款差异，需要预先验证兼容候选。

复制不能替代备份：错误删除或污染也会被快速复制，仍需不可变备份和时间点恢复。

## 工程实践

维护按依赖顺序编写的 runbook 和自动化切换，但对数据主从提升等不可逆步骤设置审批。定期做区域断网、配额耗尽、对象存储不可用和供应商超时演练，实测恢复时间、数据缺口、备用容量与回切。DNS TTL、证书、密钥、监控和告警接收链路也必须纳入演练，而不只测试模型端点。

## 常见追问

1. RTO、RPO 应该按整个平台定义，还是按组件定义？
2. 为什么已经跨地域复制数据库，仍然需要备份？
3. 备用模型能返回结果，为什么还不能直接作为容灾方案？

## 一句话复习

> 用业务 RTO/RPO 决定数据复制和 GPU 预热级别，并通过可演练的安全降级而非纸面架构完成容灾。

## 参考资料

- 面试题来源：[LLM System Design Interview Guide 的高可用设计主题](https://www.systemdesign.academy/llm-system-design)
- 官方依据：[AWS Multi-Region Fundamentals](https://docs.aws.amazon.com/prescriptive-guidance/latest/aws-multi-region-fundamentals/fundamental-1.html)、[NIST SP 800-34 Rev.1](https://nvlpubs.nist.gov/nistpubs/legacy/sp/nistspecialpublication800-34r1.pdf)
