---
title: "如何设计可恢复、可去重的大模型离线批量推理系统？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "系统设计"
difficulty: "中等"
tags:
  - Batch Inference
  - 幂等
  - Kubernetes Job
published: true
verified: true
date: 2026-07-14
---

## 核心回答

离线批量推理应先冻结输入 Manifest、模型/Tokenizer/Prompt/采样版本，再把数据切成可独立重试的 Shard。每条记录使用由任务版本和输入 ID 派生的幂等输出键；Worker 只写临时结果，Shard 完整校验后再提交完成标记，协调器最终合并所有已提交 Shard。

消息投递和 Job 重试通常只能保证至少一次执行，不能假设端到端 exactly-once。通过确定性分片、幂等写、唯一约束和完成 Manifest，把重复计算转成相同结果或安全覆盖；失败只重跑未提交 Shard。

## 展开说明

- **切分**：兼顾 Token 数而非只按记录数，避免少数长 Prompt 形成 Straggler。
- **状态**：任务、Shard 和记录各自有状态与尝试次数；控制面记录元数据，大结果写对象存储。
- **恢复**：Worker 租约过期后可重试，但两个 Attempt 竞争提交时只允许一个完成版本生效。
- **隔离**：离线队列使用独立配额、低优先级或专用 GPU 池，避免挤占在线 SLO。
- **可审计**：输出携带模型、Prompt、输入 Manifest、生成参数和代码版本，支持增量重跑。

版本边界：Kubernetes Job 提供 Pod 重试和完成控制，但不替应用保证记录级幂等；Indexed Job、Pod Failure Policy 等能力和字段随 Kubernetes 版本变化。

## 工程实践

用 Token 加权调度和动态小 Shard 平衡吞吐与恢复粒度。监控完成/失败/重试 Shard、重复写冲突、Straggler、Tokens/s、每百万 Token 成本和 GPU 空闲；故障注入 Worker 被杀、结果写一半、协调器重启和同一 Shard 双重执行。

## 常见追问

1. **为什么任务成功不等于每条记录只执行一次？**  Worker 可能在结果已写但完成确认丢失后被重试，队列和 Job 控制器会再次执行；记录级幂等必须由应用保证。
2. **Shard 应该越大越好吗？**  大 Shard 调度开销低，但失败重算多且容易出现长尾；应按 Token 工作量选择能充分喂满 GPU、又可快速重试的粒度。
3. **怎样安全地支持增量重跑？**  生成新的任务/配置版本，只选择缺失或失效的输入 ID，并写入新的版本命名空间；不要原地混合不同模型或 Prompt 的结果。

## 一句话复习

> 离线批推理用冻结 Manifest、Token 感知分片、幂等输出和提交标记，把至少一次执行变成可恢复、可审计的结果集。

## 参考资料

- 官方文档：[Kubernetes Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/)
