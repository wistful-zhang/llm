---
title: "LoRA、QLoRA 与全参数微调应该如何选择？"
source: "用户提供的分级面试题单；公司归属未独立核验，技术答案依据论文或官方文档整理"
verified: true
review_status: "待复习"
category: "训练与对齐"
difficulty: "困难"
tags:
  - LoRA
  - QLoRA
  - NF4
published: true
date: 2026-07-14
---

## 核心回答

全参数微调更新全部模型权重，容量最大，但需要为大量参数保存梯度和优化器状态，训练与检查点成本最高。LoRA 冻结基座，只训练低秩适配器，适合资源有限、需要维护多个任务版本或数据规模中小的场景。QLoRA 进一步把冻结基座以 4 bit 形式存储，计算时按需反量化到较高计算精度，只训练高于 4 bit 精度的 LoRA 参数；适配器可存为 FP32、BF16 或 FP16，具体取决于框架及配置，从而显著降低基座权重显存。

QLoRA 的 NF4 是针对近似正态分布权重设计的 4 bit 数据类型；Double Quantization 再量化第一层量化所使用的常数或 scale，以减少元数据开销。QLoRA 的“4 bit”描述冻结基座的存储，不等于用 4 bit 训练 LoRA，也不等同于普通 INT4 推理模型。

## 展开说明

选择时至少比较四个维度：

1. **能力变化范围**：任务与基座差异很大、数据充足且预算允许时，全参数微调的自由度更高；这不保证它必然泛化更好。
2. **训练资源**：LoRA 减少可训练状态；当冻结基座本身仍放不下时，QLoRA 可继续压缩权重存储。
3. **质量风险**：4 bit 基座会引入量化误差，应在目标任务、长上下文和敏感切片上与 BF16 LoRA 基线比较。
4. **交付约束**：QLoRA 训练完成后能否直接以同一格式服务、是否需要合并或重新量化，取决于推理框架与硬件，不能只凭训练显存做选择。

NF4 利用权重分布设计量化点；Double Quantization 节省的是量化参数的存储，不是把 4 bit 权重再次压成更低位宽。计算 dtype、量化存储 dtype 和可训练参数 dtype 是三个不同概念，回答时必须分开。

## 工程实践

先用同一数据与评测集建立 BF16 LoRA 小规模基线，再评估 QLoRA 的峰值显存、吞吐和质量差。确认量化 kernel 真实启用，并检查 LayerNorm、Embedding、LM Head 等未量化部分。若资源足以做全参数实验，应对齐有效 Batch、训练 token 数和调度后比较，而不是用不同训练预算得出方法优劣。

## 常见追问

1. **为什么 4 bit 基座仍可用 BF16 计算？** 权重以 4 bit 保存，进入矩阵计算前按量化 scale 反量化到计算 dtype；存储位宽与计算位宽不是一回事。
2. **Double Quantization 量化的是什么？** 它量化第一层权重量化所需的常数或 scale，从而降低量化元数据占用。
3. **QLoRA 与普通 INT4 推理量化有什么区别？** QLoRA 是面向微调的“冻结量化基座+高精度适配器”方案；推理量化关注最终服务格式、kernel 和端到端性能。
4. **资源足够时是否一定选全参数微调？** 不一定；还要考虑数据量、过拟合、通用能力退化、训练稳定性和多任务版本维护成本。

## 一句话复习

> 全参微调换最大自由度，LoRA 用低秩适配器省训练状态，QLoRA 再用 4 bit 冻结基座省权重显存，最终选择必须同时验证质量与交付链路。

## 参考资料

- [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685)
- [QLoRA: Efficient Finetuning of Quantized LLMs](https://arxiv.org/abs/2305.14314)
- [Hugging Face Transformers：bitsandbytes 量化](https://huggingface.co/docs/transformers/main/en/quantization/bitsandbytes)
- [Hugging Face PEFT：适配器数据类型说明](https://huggingface.co/docs/peft/developer_guides/troubleshooting)
