---
title: "一张图片如何转换成视觉 Token？"
source: "用户提供的分级面试题单；公司归属未独立核验，技术答案依据原论文整理"
review_status: "待复习"
category: "多模态"
difficulty: "简单"
tags:
  - Vision Transformer
  - Visual Token
  - Patch Embedding
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论：** 图像通常先切成 Patch，经线性投影和视觉编码器得到序列特征，再由 projector 映射为语言模型可接收的视觉 Token。
2. **再讲关键机制：** 说明 `H×W` 图像按 `P×P` 切块，token 数约为 `HW/P²`，再加位置编码与压缩。
3. **主动说取舍：** Patch 越小细节越好但 token 二次增加；压缩越强推理更快，却可能丢小字和局部目标。
4. **最后落到项目：** 按分辨率测视觉 token 数、OCR/问答准确率、TTFT 和峰值显存；讲完停住。

**60 秒口述示例：**

> 我会先从 ViT 讲：图像按固定 patch 切块，每块展平后线性投影，加位置编码送入视觉编码器；随后通过 projector 或 resampler 对齐到 LLM 隐藏维，这些向量就是视觉 token。token 数大致随图像面积除以 patch 面积增长。项目里我会权衡分辨率和压缩率，同时报告视觉 token 数、OCR 与问答准确率、TTFT 和峰值显存。 如果追问，我再展开 projector 的训练。


## 核心回答

以 Vision Transformer 为例，图片先经过尺寸调整和归一化，再被切成固定大小的 Patch。每个 Patch 展平后通过线性层映射成一个向量，加上位置表示后送入视觉 Transformer；视觉编码器输出的 Patch 特征就可以作为视觉 Token。实现中 Patch Embedding 常用卷积核和步长都等于 Patch 大小的卷积完成，它与“切块、展平、线性投影”等价。

若输入尺寸为 `H × W`、Patch 边长为 `P`，且尺寸可整除，则 Patch 数约为 `N = (H/P) × (W/P)`。分类 ViT 常在序列前加入 `CLS` Token 并用它做全局分类；生成式 VLM 往往保留多个 Patch Token，再通过 Projector、Pooling 或 Resampler 接给语言模型，因此不一定保留或只使用 `CLS`。

## 展开说明

完整链路通常包括：

1. **图像预处理**：缩放、裁剪、填充和像素归一化，具体规范必须与视觉编码器训练时一致。
2. **Patch 化**：把二维图片变成 Patch 序列；Patch 越小，空间细节越多，Token 数也越大。
3. **位置建模**：加入可学习二维位置、插值后的位置向量或其他空间位置机制，让模型区分不同区域。
4. **视觉编码**：通过 ViT 等网络得到上下文化视觉特征。
5. **接口适配**：按 VLM 架构选择全部 Patch、若干层特征、全局 Token，或者进一步压缩后的 Token。

当高和宽都扩大两倍时，未压缩的 Patch 数约变为四倍。对采用全局自注意力的视觉编码器，注意力分数交互数可能约增至十六倍；但窗口注意力、Token 剪枝等架构不会完全遵循这个估算，所以应结合实际实现判断。

## 工程实践

上线前应锁定图片色彩空间、插值方式、裁剪策略和最大像素数，避免训练与推理预处理不一致。统计真实图片的长宽比、视觉 Token 数、视觉编码耗时与 LLM Prefill 时间；OCR、图表和小目标任务要单独回归，因为粗暴缩放最容易损失细字。动态分辨率或切图虽然保留细节，也会增加 Token、显存和延迟，需要明确每请求的视觉 Token 预算。

## 常见追问

1. **为什么可以用卷积实现 Patch Embedding？** 卷积核和步长都设为 `P` 时，每个互不重叠窗口会产生一个投影向量，等价于对每个 Patch 使用共享线性层。
2. **分辨率如何影响视觉 Token 数？** 在 Patch 大小不变时，Token 数近似与图像面积成正比；高和宽各翻倍会让 Patch 数约翻四倍。
3. **VLM 一定使用 `CLS` Token 吗？** 不一定；许多生成式 VLM 需要保留空间细节，会使用 Patch Token 或压缩后的多 Token 表示。
4. **Patch 越小是否一定越好？** 不是；小 Patch 保留更多细节，但显著增加视觉计算、LLM 上下文和训练数据需求。

## 一句话复习

> 图片先被切成 Patch 并投影为带位置的向量序列，视觉编码器再把这些向量变成可供 VLM 使用的视觉 Token。

## 参考资料

- 原论文：[An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale](https://arxiv.org/abs/2010.11929)
- VLM 接口示例：[Visual Instruction Tuning](https://arxiv.org/abs/2304.08485)
