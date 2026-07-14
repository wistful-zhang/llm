---
title: "FP8 推理与 INT8、INT4 推理有什么区别？"
source: "用户提供的分级面试题单；公司归属未独立核验，技术答案依据论文整理"
verified: true
review_status: "待复习"
category: "工程实践"
difficulty: "中等"
tags:
  - FP8
  - INT8
  - 量化
published: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论：** FP8 保留浮点指数、动态范围较大，适合矩阵计算；INT8/INT4 用定点刻度，压缩更强但量化误差更敏感。
2. **再讲关键机制：** 比较格式、scale 粒度、权重/激活量化和校准，并说明硬件 kernel 是否原生支持。
3. **主动说取舍：** 更低 bit 能省显存和带宽，却可能增加反量化开销与质量损失，理论压缩不等于真实加速。
4. **最后落到项目：** 在目标 GPU 上报告显存、tokens/s、TTFT/TPOT、困惑度和任务掉点；讲完停。

**60 秒口述示例：**

> 我会先从数值格式回答：FP8 有指数位，对激活中的大动态范围更友好；INT8 和 INT4 依赖 scale 把值映射到整数，位宽更低但对异常值和分组策略敏感。选择还取决于目标 GPU 是否有原生 Tensor Core 与成熟 kernel。项目里我会在同一模型、批量和上下文下，对比峰值显存、tokens/s、TTFT、TPOT、PPL 与关键任务掉点。 质量分桶会覆盖长上下文和少数任务。


## 核心回答

FP8 用浮点指数和尾数表示数值，常见 E4M3 偏精度、E5M2 偏动态范围；INT8/INT4 用定点整数配合 scale（有时还有 zero-point）还原数值。FP8 通常更容易覆盖动态范围较大的权重或激活，适合有原生 FP8 Tensor Core 与软件栈支持的硬件；INT 尤其 INT4 能把权重压得更小，但对离群值、分组粒度、反量化 kernel 和校准更敏感。

“权重文件是 FP8/INT4”与“矩阵乘真正以该精度执行”不是一回事。Weight-only INT4 常在计算前反量化到更高精度激活路径；W8A8 或 FP8 W8A8 才同时压缩权重与激活并使用相应低精度 kernel。是否加速必须由目标 GPU 和端到端实测决定。

## 展开说明

E4M3 有 4 位指数、3 位尾数，E5M2 有 5 位指数、2 位尾数；实际训练/推理还需要选择 scale 的粒度和累加精度，乘法输入为低精度时通常也会用更高精度累加，但具体路径由硬件和 kernel 决定。INT 量化则常写成 `x ≈ s(q - z)`，其中 `q` 是整数、`s` 是 scale、`z` 是 zero-point。对称量化可令 `z=0`，按通道或按 block/group 的 scale 通常比整张量一个 scale 更能适应不同范围，但元数据和 kernel 更复杂。

INT4 的理论存储仅为 FP16/BF16 的四分之一，实际还包含 scale、未量化层和对齐开销；FP8 或 INT8 约为一半。KV Cache、激活和通信若仍占主导，只压权重不会同比例减少总显存或延迟。

## 工程实践

从 BF16/FP16 基线出发，在同一硬件和框架上确认 kernel 日志，再比较任务质量、格式正确率、长文本稳定性、峰值显存、TTFT、TPOT 和不同并发的 tokens/s。校准样本必须覆盖真实语言、领域和长度；分别报告权重精度、激活精度、KV 精度、scale 粒度与累加精度，避免只写一个含糊的“FP8 模型”。

## 常见追问

1. **E4M3 与 E5M2 如何选择？** E4M3 尾数更多、精度更高；E5M2 指数更多、动态范围更大，具体选择还受硬件 kernel 和张量用途影响。
2. **FP8 权重是否代表计算一定使用 FP8？** 不代表。框架可能反量化或让部分算子回退到 BF16/FP16，必须检查实际执行路径。
3. **为什么激活量化通常比只量化权重困难？** 激活随输入和 token 动态变化，离群值与范围更难用固定校准参数覆盖。

## 一句话复习

> FP8 用指数换动态范围，INT4/8 用 scale 换压缩率；真正收益由量化对象、粒度、kernel 和目标负载共同决定。

## 参考资料

- [FP8 Formats for Deep Learning](https://arxiv.org/abs/2209.05433)
- [SmoothQuant：W8A8 量化](https://arxiv.org/abs/2211.10438)
- [NVIDIA Transformer Engine FP8 官方说明](https://docs.nvidia.com/deeplearning/transformer-engine/user-guide/examples/fp8_primer.html)
