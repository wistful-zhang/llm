---
title: "MFU、HFU 与 Tokens/s 应如何衡量训练效率？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "训练工程"
difficulty: "中等"
tags:
  - MFU
  - HFU
  - 训练性能
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论**：先说 Tokens/s 是业务吞吐，MFU 衡量必要模型计算占峰值比例，HFU 还计入实际重算。
2. **再讲关键机制**：给出 FLOPs/秒除硬件理论峰值的定义，并说明激活重算为何让 HFU 高于 MFU。
3. **主动说取舍**：高 HFU 可能只是做了更多重算，不代表有效训练更快；跨模型直接比 Tokens/s 也失真。
4. **最后落到项目**：按 Step 时间线拆计算、通信、数据和空闲，联合报告 MFU、Samples/s 与有效 Token 成本。

**60 秒口述示例：**

> 我的结论是 Tokens/s 只适合同配置前后对比；MFU 用模型理论必要 FLOPs 除以硬件峰值，回答设备有多少算力真正用于模型；HFU 按实际执行 FLOPs 统计，激活重算也算进去，所以可能高于 MFU。这里要说明 HFU 高不一定更有效。项目中我会先看 GPU 时间线，把 Step 拆成 Kernel、通信、DataLoader 和气泡，再联合报告 MFU、HFU、Samples/s、每个有效 Token 的成本和训练到目标 Loss 的总时间。

## 核心回答

Tokens/s 是实际处理速度，但不同参数量和序列长度不能直接横比。MFU（Model FLOPs Utilization）用“完成模型规定的有效前向与反向计算所需 FLOPs/s”除以硬件对应精度的理论峰值；HFU（Hardware FLOPs Utilization）则统计硬件实际执行的全部 FLOPs，包括激活重计算等额外工作。

启用 Activation Checkpointing 时，重算会提高硬件实际工作量，因此 HFU 可能高于 MFU；这不代表更多重算提高了有效训练效率。对稠密 Decoder，一个常用粗估是每训练 Token 约 `6N` FLOPs，但长上下文注意力、Embedding、MoE 激活参数和具体反向实现会使该近似失真。

## 展开说明

计算利用率时要明确分母：GPU 数量、型号、实际时钟、数据类型、Tensor Core 模式和是否计入稀疏峰值。分子也要公布公式，避免不同团队都称 MFU 却采用不同 FLOPs 口径。

- **MFU 低** 可能来自 Pipeline Bubble、通信、DataLoader、CPU Launch、小矩阵、同步或负载不均。
- **HFU 高而 MFU 低** 可能说明硬件在忙于重计算或其他非模型有效工作。
- **Tokens/s 高** 也可能只是模型更小、序列更短或减少了有效训练计算，必须结合质量与配置。

版本边界：不同论文与训练框架对 FLOPs 的近似、MoE 专家和 Attention 项是否计入并不统一；硬件峰值也随精度与稀疏模式变化，报告时必须固定计算器版本和假设。

## 工程实践

从 Step 时间拆出数据等待、Forward、Backward、Optimizer、通信和 Bubble，再用 Profiler 查看 GEMM 尺寸与 Kernel 空隙。性能报告至少包含模型配置、序列长度、全局 Batch、精度、重计算、并行策略、GPU 数、Tokens/s、MFU 公式和端到端时间。

## 常见追问

1. **为什么不能只比较 Tokens/s？**  一个 Token 的计算量随模型、上下文和架构变化；Tokens/s 更适合同一配置的优化前后对比，跨模型要结合 FLOPs 与质量。
2. **HFU 高于 MFU 是否矛盾？**  不矛盾。HFU 把激活重算等实际执行的 FLOPs 也算作忙碌，MFU 只奖励模型必要计算。
3. **MFU 很低时先查什么？**  先用时间线判断 GPU 是等待数据、通信、其他 Stage 还是 CPU Launch，再针对最长空闲来源优化，不能直接归因于 Kernel。

## 一句话复习

> Tokens/s 是速度，MFU 衡量有效模型计算占峰值的比例，HFU 还计入重算等实际工作；三者必须连同口径一起报告。

## 参考资料

- 原始论文：[Efficient Large-Scale Language Model Training on GPU Clusters Using Megatron-LM](https://arxiv.org/abs/2104.04473)
