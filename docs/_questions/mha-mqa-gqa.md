---
title: "MHA、MQA 和 GQA 的区别是什么？"
source: "公开真实面试问题汇总中的高频注意力变体题；答案依据 MQA 与 GQA 原论文原创整理"
review_status: "待复习"
category: "LLM 基础"
difficulty: "中等"
tags:
  - MHA
  - MQA
  - GQA
published: true
verified: true
date: 2026-07-13
---

## 面试时怎么答

MHA、MQA、GQA 用 KV Head 数一眼区分：MHA 每个 Query Head 独立 K/V，MQA 全部共享，GQA 分组共享。随后解释共享为何降低 KV Cache 与 Decode 带宽，但不会同比减少 Query 计算；GQA 是常见折中，追问时再谈质量和 Tensor Parallel 的 Head 整除。

**可以这样答：**

> 三者的核心差别是 KV Head 数：MHA 为每个 Query Head 保留独立 K/V，MQA 让所有 Query Head 共享一组，GQA 则按组共享。共享 KV 会明显减少 KV Cache 和 Decode 内存带宽，但 Query 投影仍然存在。MHA 表达能力更充分，MQA 最省，GQA 常作为质量与效率的折中。

## 核心回答

三者主要区别是 Query Head 与 Key/Value Head 的共享方式。MHA 为每个 Query Head 配置独立的 K/V Head；MQA 让所有 Query Head 共享同一组 K/V；GQA 把多个 Query Head 分组，每组共享一组 K/V。减少 KV Head 可以缩小 KV Cache 和解码时的内存读取量，MQA 最省，MHA 表达自由度最高，GQA 在质量与推理效率之间折中。

## 展开说明

设 Query Head 数为 `h_q`、KV Head 数为 `h_kv`：MHA 中二者通常相等，MQA 中 `h_kv = 1`，GQA 则满足 `1 < h_kv < h_q`，且实现通常要求分组可整除。它们并没有消除注意力随上下文增长的计算，只是降低 K/V 投影、缓存容量以及解码阶段读取历史 K/V 的带宽压力。

共享 K/V 可能限制不同 Query Head 独立表示历史信息的能力，因此 MQA 并非无条件更好。GQA 论文展示了从 MHA 检查点向 GQA 转换并继续训练的方案，但具体质量仍受模型规模、数据和训练配方影响。

## 工程实践

部署前应根据层数、序列长度、并发和数据类型估算 KV Cache，而不只比较参数量。做张量并行时要检查 Head 数与并行度的整除关系，并确认推理框架真的支持该模型的 KV Head 布局。评测应同时覆盖任务质量、tokens/s、单 token 延迟和最大稳定并发。

## 常见追问

1. **GQA 为什么能显著减小 KV Cache，却不会同比减少全部计算？** 它减少的是需要保存和读取的 KV Head，Query Head 及其投影仍保留，注意力得分计算也不会按相同比例消失。
2. **如何把一个 MHA 检查点改造成 GQA？** 常把同组 K/V Head 的权重做均值或池化初始化，再继续训练恢复质量；不能只改配置而不处理权重形状。
3. **Tensor Parallel 对 Query Head 和 KV Head 数有什么约束？** Head 数需与并行分片方式兼容，通常要求可整除或复制少量 KV Head；否则会产生不均衡或额外通信。

## 一句话复习

> MHA 不共享 K/V，MQA 全部共享，GQA 分组共享；共享越多，KV 开销越小，但要验证质量取舍。

## 参考资料

- 面试主题：[Datawhale 的 LLM、VLM 与 Agent 面试问题总结](https://github.com/datawhalechina/hello-agents/blob/main/Extra-Chapter/Extra01-%E9%9D%A2%E8%AF%95%E9%97%AE%E9%A2%98%E6%80%BB%E7%BB%93.md)
- 技术依据：[Multi-Query Attention](https://arxiv.org/abs/1911.02150)、[Grouped-Query Attention](https://arxiv.org/abs/2305.13245)
