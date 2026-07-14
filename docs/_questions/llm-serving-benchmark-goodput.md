---
title: "如何设计可信的 LLM Serving 压测并计算 Goodput？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "推理与部署"
difficulty: "中等"
tags:
  - 压测
  - Goodput
  - SLO
published: true
verified: true
date: 2026-07-14
---

## 核心回答

可信压测首先要复现生产的模型、采样配置、输入/输出长度联合分布、前缀复用率、并发和到达过程，再同时报告 TTFT、TPOT/ITL、端到端延迟、请求/Token 吞吐、错误率与资源成本。只报告平均 Tokens/s 会掩盖排队和尾延迟。

Goodput 是单位时间内满足既定 SLO 的有效请求数或有效 Token 数。若一分钟完成 100 个请求，但只有 80 个同时满足 TTFT 与 TPOT 约束，请求 Goodput 是 80/min，而不是吞吐 100/min；SLO 定义必须随结果一起公开。

## 展开说明

- **Open-loop** 按独立到达过程发请求，能暴露过载排队；Closed-loop 要等响应后再发，系统变慢时负载也自动降低，容易低估尾延迟。
- **Warmup** 应覆盖模型加载、编译、CUDA Graph 和 Cache 稳态，但也要单独报告冷启动。
- **样本** 不能只用固定短 Prompt；输入与输出长度、Adapter、工具调用和命中率都可能改变瓶颈。
- **统计** 报告 P50/P95/P99 和置信区间，明确客户端排队是否计入，并把超时、取消和错误计作失败。

版本边界：MLPerf 的场景、精度与运行规则适合可比基准，但不等同于任意业务 SLO；DistServe 的 Goodput 定义以 TTFT/TPOT 约束为核心，团队应固定自己的指标版本，避免报表含义漂移。

## 工程实践

用匿名化生产 Trace 或可复现的合成分布，扫描请求到达率直至出现 SLO 拐点。隔离压测客户端瓶颈，校准时钟，记录 GPU 功耗/显存/利用率和每个请求的阶段时间，并保存代码、数据、镜像、模型与配置版本，使不同引擎比较可重跑。

## 常见追问

1. **为什么 Closed-loop 容易让系统看起来更稳？**  响应变慢会降低客户端发压速度，形成自我节流；生产流量若不会同步下降，真实队列会比测试更长。
2. **Goodput 为什么比原始吞吐更适合有 SLO 的服务？**  它不奖励“虽然完成但已经慢到不可用”的请求，能把容量目标直接和用户体验约束绑定。
3. **不同推理引擎怎样公平比较？**  固定模型权重、精度、采样、输入输出、到达过程和 SLO，并验证输出正确性；同时报告最佳调优配置与调优边界，不能让一方使用不同质量目标。

## 一句话复习

> LLM 压测要复现长度与到达分布并看尾延迟；Goodput 只统计满足明确 SLO 的有效吞吐。

## 参考资料

- 官方基准：[MLCommons Inference](https://github.com/mlcommons/inference)
- 原始论文：[DistServe: Disaggregating Prefill and Decoding for Goodput-optimized Large Language Model Serving](https://arxiv.org/abs/2401.09670)
