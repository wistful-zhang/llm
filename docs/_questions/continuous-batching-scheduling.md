---
title: "Continuous Batching 如何在逐迭代调度中平衡 Token 预算、抢占与公平性？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "推理与部署"
difficulty: "中等"
study_tier: "core"
tags:
  - Continuous Batching
  - 调度
  - 推理服务
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

先与静态 Batch 对照：静态方式要等整批结束，Continuous Batching 每个 Decode Step 都可移除已完成请求、加入新请求。随后说明调度器受 Token Budget 和 KV Cache 容量约束，必要时会抢占。公平性追问不要只说 FIFO，应谈请求老化、租户配额，以及吞吐提升不能以 TPOT 尾延迟失控为代价。

**可以这样答：**

> Continuous Batching 在每个 Decode 迭代重新组成批次：完成的请求立即移出，新请求可以加入，不必等待原来整批都结束，因此 GPU 更容易持续满载。调度仍受每轮 Token Budget 和 KV Cache 容量限制，资源不足时可能抢占或延迟 Prefill。它提高吞吐，但短请求、长请求和不同租户会争用资源，需要用请求老化或配额控制公平，并同时约束 TTFT 与 TPOT。

## 核心回答

传统静态批处理通常等整批请求结束后才换批，短请求会被最长请求拖住，新请求也不能及时加入。Continuous Batching 把调度粒度缩小到一次模型迭代：调度器每轮从运行中请求各取一个解码步，移除已完成请求，并在 Token、KV Cache 和并发预算允许时接纳等待请求。

它减少了 Padding 和队头阻塞，提高了 GPU 利用率，但不是“批越大越好”。长 Prompt 的 Prefill 会干扰正在 Decode 的请求，过多活跃序列会增加 KV Cache 压力；调度器还必须处理抢占、恢复、公平性和 SLO。

## 展开说明

一次典型调度循环包括：更新已完成序列、回收其 KV Block；根据等待时间、优先级和资源预算选择新请求；为选中序列准备 Token 与位置元数据；执行一次 Forward；采样并把未完成序列放回运行集合。

- **预算约束**：不能只限制请求数，还要限制本轮 Scheduled Tokens 和可分配 KV Block。
- **公平性**：纯吞吐优先可能让长请求反复被抢占；纯 FIFO 又可能造成严重的队头阻塞。
- **抢占方式**：可交换到主存，也可丢弃 KV 后以后重算；前者消耗带宽，后者消耗算力。
- **延迟权衡**：更大的动态批通常提高吞吐，却可能拉高单轮时间和 TPOT。

版本边界：Orca 论文提出的是 Iteration-level Scheduling 与 Selective Batching；不同版本的 vLLM、SGLang 或厂商引擎在 Token 预算、抢占和 Prefill 策略上并不相同，不能把某个参数名或默认值当作通用定义。

## 工程实践

用真实的输入长度、输出长度和到达间隔回放流量，同时记录 TTFT、TPOT/ITL、端到端延迟、吞吐、队列时间、KV 使用率、抢占次数和各长度分桶的 SLO 达标率。先固定模型、采样参数与硬件，再比较静态批、连续批以及不同 Token Budget，避免只用平均 Tokens/s 得出结论。

## 常见追问

1. **Request-level 与 Iteration-level Scheduling 的本质区别是什么？**  前者通常把整次生成视为不可更换的执行单元；后者每生成一步就能重组批次，因此完成的请求可以立即退出，等待请求也可及时进入。
2. **为什么 Continuous Batching 仍可能出现队头阻塞？**  很长的 Prefill 或一次调度过多 Token 会让该轮执行时间变长，所有 Decode 请求都要等待这一轮结束；可通过 Chunked Prefill、Token Budget 和优先级控制缓解。
3. **发生 KV Cache 不足时应该怎样抢占？**  应按重算成本、已等待时间和优先级选择请求，并在 Swap 与 Recompute 间权衡带宽和算力；恢复后还要保证随机状态、位置和输出顺序正确。

## 一句话复习

> Continuous Batching 用逐迭代重组批次减少空等，但真正的难点是同时管理 Token 预算、KV Cache、公平性与尾延迟。

## 参考资料

- 原始论文：[Orca: A Distributed Serving System for Transformer-Based Generative Models](https://www.usenix.org/conference/osdi22/presentation/yu)
