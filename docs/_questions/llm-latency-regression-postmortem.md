---
title: "项目复盘：模型升级后 P99 延迟翻倍，应该如何排查？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "系统设计"
difficulty: "困难"
tags:
  - 项目复盘
  - 延迟
  - 性能分析
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

延迟复盘题只使用真实故障数据，先说影响范围和是否回滚，再把 P99 拆成排队、TTFT、TPOT、网络与工具调用。用同流量回放、长度/并发分桶和新旧 Trace 找到第一个变慢阶段，最后交代修复、验证和新增告警；没有亲历就明确按排障方案推演。

**可以这样答：**

> 模型升级后 P99 翻倍，应先冻结放量或回滚，再把延迟拆成排队、TTFT、TPOT、网络和工具调用。用同一批流量按长度、并发分桶回放，对齐新旧版本 Trace，找到第一个变慢的阶段；修复后同时验证 P50/P99、Goodput、错误率和成本，避免只把问题转移到吞吐。

## 核心回答

优秀复盘先交代 SLO、退化幅度、受影响用户和你承担的职责，再把端到端延迟分解。TTFT 包含网关、排队、Tokenize 与 Prefill，TPOT 主要反映 Decode 和调度；P99 还受请求长度、并发、批处理、KV Cache、网络与重试影响。固定流量回放，对旧新版本按长度、租户、GPU、时间和错误分桶。

用分布式 Trace 和 GPU Timeline 找首个延迟增长阶段，再做单变量回退：模型权重、精度、引擎、Kernel、Batch、Cache 和路由。先回滚或限流恢复用户体验，再实施永久修复。结尾报告延迟、吞吐和成本的共同变化，不能用牺牲一切吞吐的方案宣称修复 P99。

## 展开说明

P50 不变而 P99 变差常指向排队、长尾长度、热点副本、缓存 Miss 或重试风暴；所有分位都变差更可能是模型计算或网络基础开销。需要区分输入分布变化与代码退化，并检查观测系统的 Histogram Bucket、时钟和采样是否改变。

## 工程实践

发布前用真实长度分布和阶梯并发压测，保存旧版基线。线上同时看 TTFT、TPOT、队列年龄、Batch 大小、KV Cache 利用率、GPU Kernel 和 SLO Goodput。Canary 以尾延迟与错误预算自动停止，预留配置级快速回滚而非必须重新构建镜像。

## 常见追问

1. **为什么不能只看平均延迟？** 少量极慢请求会被平均值稀释，而它们直接影响用户和超时；应至少报告 P50、P95/P99 及分桶分布。
2. **TTFT 与 TPOT 分别帮助定位什么？** TTFT 更敏感于排队、长 Prompt 和 Prefill，TPOT 更敏感于 Decode 调度、KV 访问和每步计算。
3. **加机器为什么不一定解决 P99？** 若瓶颈是单请求长 Prefill、热点路由、同步锁或错误重试，扩容可能不改变根因，甚至增加跨机开销。

## 一句话复习

> 延迟复盘先拆端到端阶段并按负载分桶，用同流量单变量对照找根因，再以 Goodput、成本和防复发收尾。

## 参考资料

- [DistServe: Disaggregating Prefill and Decoding for Goodput-optimized LLM Serving](https://arxiv.org/abs/2401.09670)
- [Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180)
