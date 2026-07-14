---
title: "vLLM 与 SGLang 的设计侧重点有什么不同，应该如何选择？"
source: "用户提供的分级面试题单；公司归属未独立核验，技术答案依据论文整理"
verified: true
review_status: "待复习"
category: "工程实践"
difficulty: "中等"
tags:
  - vLLM
  - SGLang
  - 推理框架
published: true
date: 2026-07-14
---

## 核心回答

两者都是快速演进的高性能 LLM/VLM 推理系统，能力已经大量重叠，不能用“一个只适合聊天、另一个只适合 Agent”简单划线。vLLM 以通用模型服务引擎起家，代表性设计是 PagedAttention、连续批处理和兼容式服务接口；SGLang 最初同时提供结构化语言模型程序前端与运行时，代表性设计包括用于前缀复用的 RadixAttention，以及面向结构化生成的压缩有限状态机。

选型应基于当前版本、目标模型和真实流量实测：普通兼容 API、生态集成和模型支持可重点验证 vLLM；前缀高度重复、多阶段生成、复杂结构化约束或程序化工作流可重点验证 SGLang，但最终仍要比较正确性、吞吐、TTFT/TPOT、显存和运维成熟度。

## 展开说明

vLLM 论文重点解决动态请求下 KV Cache 的碎片和预留浪费，并围绕调度、并行、量化、Prefix Cache、Chunked Prefill 等形成服务栈。SGLang 论文把生成、并行和控制流表达成语言原语，运行时用 Radix Tree 管理可复用前缀的 KV Cache，并优化受约束解码。

这些是“设计出发点”而非永久功能边界。框架版本更新可能加入对方已有的能力，同一功能在不同模型、GPU 和请求分布下也可能表现相反。因此面试回答应注明比较维度和版本，本文只描述参考资料发布时及随后稳定版本的设计脉络，不背固定的性能倍数。

## 工程实践

用同一模型、精度、并行度、采样参数和数据集做可复现实验，至少分三类负载：独立短请求、长上下文聊天、共享长前缀或结构化输出。除吞吐外，检查输出一致性、流式接口、LoRA/量化/VLM 支持、监控指标、滚动升级、故障恢复和团队已有生态。压测前确认两边都启用了预期 kernel 和缓存功能。

## 常见追问

1. **RadixAttention 与普通 Prefix Cache 的关系是什么？** 都复用相同前缀的 KV；RadixAttention 用 Radix Tree 组织可共享前缀并把缓存复用与调度结合起来。
2. **结构化生成为什么需要专门优化？** JSON Schema 或正则约束会限制每步合法 token；低效实现可能在 CPU 与 GPU 间频繁同步，压低吞吐。
3. **能否直接说 SGLang 一定比 vLLM 快？** 不能。结果依赖版本、模型、硬件、输入输出长度、前缀重复率和配置，必须在目标负载上比较。

## 一句话复习

> vLLM 与 SGLang 的历史侧重点不同但能力持续重叠，选型要围绕实际请求结构和可复现基准，而不是背框架标签。

## 参考资料

- [vLLM / PagedAttention 论文](https://arxiv.org/abs/2309.06180)
- [SGLang 论文](https://arxiv.org/abs/2312.07104)
- [vLLM 官方文档](https://docs.vllm.ai/en/stable/)
- [SGLang 官方文档](https://docs.sglang.io/)
