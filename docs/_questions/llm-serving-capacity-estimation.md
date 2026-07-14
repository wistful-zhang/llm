---
title: "如何对大模型在线服务做容量估算？"
source: "公开 LLM 系统设计面试题；依据服务系统论文与官方指标文档原创整理"
review_status: "待复习"
category: "系统设计"
difficulty: "简单"
tags:
  - 容量估算
  - Token Throughput
  - SLO
published: true
verified: true
date: 2026-07-13
---

## 核心回答

先收集峰值到达率、突发系数、输入与输出 token 的 p50/p95、模型与精度、并发方式以及 TTFT/TPOT SLO。然后在目标硬件和相同调度配置上压测单副本“满足 SLO 时的可持续吞吐”，分别观察 Prefill 与 Decode。若压测复现了同一输入/输出长度分布，可用峰值 requests/s 除以单副本满足 SLO 的可持续 requests/s 粗估副本数；否则应分别核算 Prefill 与 Decode 的工作量和容量并取瓶颈。最后再加故障、发布和突发余量，并用混合流量回放验证，不能拿厂商峰值 FLOPS 直接换算。

显存也要单独预算：模型权重约为参数量乘位宽，另加量化元数据、运行时工作区和随并发、上下文增长的 KV Cache。权重能装下只代表能启动，不代表能承载目标并发。

## 展开说明

容量估算至少包含四张账：

- **流量账**：按任务拆输入/输出 token，而非只看 QPS；相同 QPS 的长文总结和短分类负载完全不同。
- **显存账**：权重、KV Cache、激活/工作区和安全余量分别估算。每 token 的 KV 大小与层数、KV head 数、head 维度和数据类型相关。
- **延迟账**：Prefill 更受输入长度和计算影响，Decode 常受逐 token 数据搬运与批调度影响，二者不能只用一个平均吞吐描述。
- **可用性账**：预留至少能覆盖单个故障域、滚动发布和扩容冷启动的容量，具体比例由 SLO 与成本决定。

利用 Little's Law，稳定阶段平均在途请求约等于到达率乘平均停留时间，可用于交叉检查并发估计，但长尾和突发仍需排队模型与压测验证。

## 工程实践

从生产样本只提取脱敏长度和到达时间分布，回放稳态、突发、超长输入与客户端取消场景。容量报告应给出在明确 SLO 下的 tokens/s，而不是一个脱离延迟的最大值；同时记录队列、拒绝率、KV 占用和降级触发点，并每次更换模型、量化或推理引擎后重新标定。

## 常见追问

1. 为什么相同 QPS 可能需要完全不同的 GPU 数量？
2. 权重显存与 KV Cache 显存怎样分别估算？
3. 单副本 benchmark 如何转化为带冗余的生产容量？

## 一句话复习

> 以真实 token 长度和 SLO 标定单副本能力，再把显存、峰值、故障余量和冷启动纳入容量计划。

## 参考资料

- 面试题来源：[LLM System Design Interview Guide](https://www.systemdesign.academy/llm-system-design)
- 技术依据：[PagedAttention / vLLM 论文](https://arxiv.org/abs/2309.06180)、[vLLM Production Metrics](https://docs.vllm.ai/en/latest/usage/metrics/)
