---
title: "大模型量化中的 INT8、INT4、PTQ 和 QAT 应该如何理解与选择？"
source: "公开 AI 工程面试题库；原论文与官方文档核验后原创整理"
review_status: "待复习"
category: "工程实践"
difficulty: "简单"
tags:
  - 模型量化
  - INT8
  - INT4
published: true
verified: true
date: 2026-07-13
---

## 核心回答

量化是用更低位宽表示权重、激活或 KV Cache，以减少显存占用和数据搬运；它是否加速，取决于硬件和推理框架有没有对应的高效算子。面试时应先说清量化对象：例如 W8A8 同时量化权重和激活，W4A16 通常只把权重压到 4 bit、计算时仍使用较高精度激活。PTQ（训练后量化）在已有模型上直接量化，通常只需要少量校准数据；QAT（量化感知训练）在训练中模拟量化误差，成本更高，但在低位宽或敏感任务上可能更稳。

选择时先建立 BF16/FP16 基线，再从硬件支持良好的 8 bit 或 weight-only 4 bit 方案开始，用目标任务评测质量，并实测显存、吞吐和延迟。不能只根据“位宽减半”推断服务一定快一倍。

## 展开说明

若模型有 `N` 个参数、每个权重用 `b` bit，权重主体约占 `N × b / 8` 字节；实际还包含 scale、zero-point、未量化层、运行时工作区和 KV Cache。常见取舍包括：

- **精度与粒度**：按通道或按较小 group 量化通常更能适应不同数值范围，但元数据和算子开销也更高。
- **离群值**：少量大幅值通道可能主导误差。GPTQ 使用近似二阶信息逐层降低权重量化误差；AWQ 根据激活统计保护较重要的权重通道。
- **校准数据**：应接近真实输入的语言、长度和领域；只用很小且失真的样本，可能低估质量损失。
- **端到端性能**：模型若仍受其他算子、通信或 KV Cache 限制，权重变小并不等价于同比例降低延迟。

## 工程实践

固定模型、tokenizer、服务框架和生成参数，对同一批代表性样本比较基线与量化版本。至少记录任务质量分片、拒答或格式错误率、峰值显存、TTFT、TPOT 和不同并发下的 tokens/s。还要验证目标 GPU 的量化 kernel 是否真正启用；若发生频繁反量化或回退算子，模型虽然更小，吞吐反而可能没有改善。

## 常见追问

1. 为什么 4 bit 模型不一定比 8 bit 模型快一倍？
2. 权重量化、激活量化和 KV Cache 量化分别影响什么？
3. 校准集应该怎样构造，如何判断量化损失可接受？

## 一句话复习

> 量化先分清对象与算子支持，再用真实任务同时验证质量、显存和端到端速度。

## 参考资料

- 面试题来源：[AI Engineering Interview Questions 的量化与部署题](https://github.com/amitshekhariitbhu/ai-engineering-interview-questions)
- 技术依据：[GPTQ 论文](https://arxiv.org/abs/2210.17323)、[AWQ 论文](https://arxiv.org/abs/2306.00978)、[Transformers 量化文档](https://huggingface.co/docs/transformers/quantization/overview)
