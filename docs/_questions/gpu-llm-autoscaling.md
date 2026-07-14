---
title: "GPU 大模型服务应该根据什么信号自动扩缩容？"
source: "公开 LLM 部署面试题整理；依据 Kubernetes 与 vLLM 官方文档原创整理"
review_status: "待复习"
category: "系统设计"
difficulty: "困难"
tags:
  - Autoscaling
  - GPU
  - Queue
published: true
verified: true
date: 2026-07-13
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论：** LLM 自动扩缩容应看排队 token 工作量和 SLO 预测，GPU 利用率只能作为辅助信号。
2. **再讲关键机制：** 用到达 token/s、待处理 prefill/decode token、当前服务率和冷启动时间估算所需副本。
3. **主动说取舍：** 扩容过慢会错过突发，过于敏感又产生抖动与成本浪费；缩容还要先排空流式请求。
4. **最后落到项目：** 报告 SLO 达标率、扩容生效时间、队列 P95、GPU 成本和扩缩容次数；说完停。

**60 秒口述示例：**

> 我会先说为什么不能只看 GPU 利用率：decode 可能带宽受限但利用率不高，排队已经恶化。更合适的是预测到达 token 工作量，对比每副本服务率和 TTFT/TPOT SLO，再把镜像加载、权重初始化和预热算进提前量。项目里我会设置滞回和 drain，监控 SLO 达标率、扩容生效时间、队列 P95、单位百万 token 成本及抖动次数。


## 核心回答

不要只按 GPU 利用率或 QPS 扩容。LLM 请求长度差异大，优先使用等待请求/等待 token、排队时间、KV Cache 压力、TTFT SLO 和单位副本可持续 token 吞吐等工作量信号；CPU、GPU 和错误率作为保护信号。扩容要同时协调推理副本和 GPU 节点：Pod 创建很快不代表节点、权重下载、引擎编译和模型预热已经完成，因此需要最小热副本、预测性预扩和 readiness 门禁。

缩容采用稳定窗口与滞回，先停止接新请求并排空活跃序列，不能直接杀掉仍在流式生成的副本。容量决策始终受 SLO、预算、配额和故障冗余共同约束。

## 展开说明

一个实用控制器可以组合：

- **需求信号**：按模型池统计待处理 token 工作量和到达率趋势，避免一个超长请求与大量短请求被当成相同 QPS。
- **服务信号**：TTFT 和队列年龄越界时快速扩；TPOT 退化可能来自 Batch、KV 或通信，不应无条件继续加副本。
- **容量模型**：用满足 SLO 的每副本 tokens/s 估算目标副本数，并保留故障与发布余量。
- **冷启动模型**：节点供应、镜像、权重、CUDA Graph 和缓存预热分别计时，提前量至少覆盖实际启动分布。
- **稳定性**：设置 scale-up 速率、scale-down 冷却、最小驻留时间和上限，防止噪声导致抖动与成本失控。

多模型或多适配器平台应按可独立扩缩的模型池管理；把所有模型混成一个平均指标会掩盖热点。

## 工程实践

把 vLLM 等引擎的队列与 KV 指标通过自定义指标接入 HPA/KEDA 或专用控制器，并让节点自动伸缩器负责底层 GPU。用阶跃、突发、长尾长度和区域故障负载测试调参，记录扩容触发到 Ready 的每段时间、SLO 违约面积和空闲 GPU 成本。缩容测试客户端断开、流式排空、PodDisruptionBudget 与滚动发布叠加场景。

## 常见追问

1. **为什么 GPU 利用率不适合作为唯一扩容指标？** Decode 常受显存带宽限制，利用率未满时队列和 TPOT 也可能已超标；利用率也无法表达请求 token 长度。
2. **Pod 已经创建但 SLO 仍持续恶化，可能缺少哪些阶段？** 镜像拉取、GPU 调度、权重加载、通信组初始化、kernel 编译和 warm-up 都可能尚未完成，实例还不能接流量。
3. **如何避免扩缩容抖动和缩容中断流式请求？** 使用滞回、冷却窗口和预测扩容；缩容前把实例标为 draining，停止接新请求并等待现有流完成或安全迁移。

## 一句话复习

> 按 token 工作队列与 SLO 扩容，按完整冷启动时间预热，并在排空活跃序列后稳定缩容。

## 参考资料

- 面试题来源：[AI Engineering Interview Questions 的自动伸缩与排队题](https://github.com/amitshekhariitbhu/ai-engineering-interview-questions)
- 官方依据：[Kubernetes HPA 自定义指标](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/)、[vLLM Production Metrics](https://docs.vllm.ai/en/latest/usage/metrics/)
