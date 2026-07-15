---
title: "Dynamic Resolution 与 AnyRes 为什么对 VLM 很重要？"
source: "用户提供的分级面试题单；公司归属未独立核验，技术答案依据原论文整理"
review_status: "待复习"
category: "多模态"
difficulty: "中等"
tags:
  - Dynamic Resolution
  - AnyRes
  - 高分辨率
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

先说明固定方形缩放为什么伤害宽图、小字和高分辨率细节，再讲 AnyRes 怎样选网格、切局部块，并配一张全局缩略图。不要只说“分辨率更高效果更好”：视觉 Token 会随块数增长，跨块目标也可能被切断。追问选网格时，要同时考虑原图长宽比、Token 预算和编码器输入尺寸。

**可以这样答：**

> 固定把图片缩成方形会扭曲长宽比，并让小字和局部细节丢失。AnyRes 根据原图尺寸选择网格，把图片切成多个高分辨率局部块，同时保留一张全局缩略图，再将这些特征送入语言模型。它能兼顾全局与细节，但块数越多，视觉 Token、显存和延迟越高，跨块目标也更难建模，因此网格要受 Token 预算约束。

## 核心回答

固定把所有图片缩放到同一个正方形，会让超宽、超高图片变形或被裁剪，也可能把文档小字、图表刻度和小目标压到不可辨认。Dynamic Resolution 允许模型根据原始尺寸和长宽比处理不同数量或布局的视觉 Token；AnyRes 类方法通常选择接近原图比例的网格，把高分辨率图片分成多个局部 Tile，并配合全局缩略图，让模型同时获得整体布局和局部细节。

代价是视觉 Token 会随有效像素或 Tile 数增长。若每个 Tile 产生 `n` 个 Token、使用 `k` 个局部 Tile，再加一个全局视图，则压缩前输入规模近似为 `(k + 1) · n`；这是忽略 Unpadding、换行/分隔符和额外位置 Token 的估算。更多 Token 会增加视觉编码、LLM Prefill 和显存成本；是否明显增加 KV Cache 则取决于视觉 Token 如何注入、是否被压缩以及具体缓存实现。

## 展开说明

动态分辨率不是单一算法。NaViT 把不同分辨率和长宽比的图片打包成序列训练，避免统一强制缩放；LLaVA-NeXT 的 AnyRes 方案选择预设网格并组合全局与局部视图；其他模型可能使用原生分辨率、窗口注意力、Token Merge 或查询压缩。共同目标是在细节、Token 预算和吞吐之间做自适应权衡。

切图也会产生新问题：Tile 边界可能切断对象或文字，多个 Tile 需要明确二维位置，重复区域会带来冗余，全局关系可能因只看局部块而变弱。因此常保留一个低分辨率全局视图，并向模型提供 Tile 顺序或空间位置。不能只增加最大分辨率，还要用对应分辨率和长宽比分布训练或适配位置机制。

## 工程实践

服务入口应限制最大像素、最大 Tile 数和最大视觉 Token，并按文档、自然图片、图表分别选择策略。评测至少按分辨率、长宽比、字体大小和目标尺寸切片，同时记录 OCR/定位准确率、视觉编码耗时、TTFT、峰值显存和吞吐。做 AnyRes 对比时固定语言模型与数据，分别消融全局图、Tile 数和 Token 压缩，确认收益来自保留细节而不是单纯增加计算。

## 常见追问

1. **固定缩放会丢失什么信息？** 它可能造成长宽比变形、裁剪边缘内容，并让小字、小目标和密集图表细节消失。
2. **为什么高分辨率会消耗大量上下文？** Patch 大小不变时视觉 Token 数随像素面积增长；这些 Token 还会进入后续连接模块和可能的 LLM Prefill。
3. **切成更多 Tile 是否一定提高效果？** 不一定；Tile 过多会增加冗余、边界问题和延迟，超过模型训练分布后也可能没有收益。
4. **为什么常同时保留全局缩略图？** 局部 Tile 擅长细节，但可能缺少跨区域布局；全局图提供整体结构和局部块之间的参照。

## 一句话复习

> Dynamic Resolution/AnyRes 用自适应尺寸或全局加局部切图保留高分辨率细节，代价是更多视觉 Token、位置建模与服务成本。

## 参考资料

- 原生多分辨率训练：[Patch n' Pack: NaViT, a Vision Transformer for any Aspect Ratio and Resolution](https://arxiv.org/abs/2307.06304)
- AnyRes 官方项目说明：[LLaVA-NeXT: Improved reasoning, OCR, and world knowledge](https://llava-vl.github.io/blog/2024-01-30-llava-next/)
- 多场景视觉表示：[LLaVA-OneVision: Easy Visual Task Transfer](https://arxiv.org/abs/2408.03326)
