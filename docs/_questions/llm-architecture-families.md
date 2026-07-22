---
title: "Encoder-Only、Decoder-Only 和 Encoder-Decoder 架构如何选择？"
source: "公开真实面试问题汇总中的高频架构对比题；答案依据代表性模型论文原创整理"
review_status: "待复习"
category: "LLM 基础"
difficulty: "简单"
study_tier: "core"
tags:
  - Transformer
  - Decoder-Only
  - 模型架构
published: true
answer_status: complete
verified: true
date: 2026-07-13
---

## 面试时怎么答

三类架构用信息流区分最稳妥：Encoder-Only 使用双向注意力形成表示，Decoder-Only 用因果注意力自回归生成，Encoder-Decoder 通过 Cross-Attention 做条件生成。选型只需联系输入输出形态和推理方式，别把“理解、生成、翻译”说成绝对边界。

**可以这样答：**

> Encoder-Only 使用双向注意力，适合得到整段输入的上下文表示；Decoder-Only 使用因果注意力，天然适合自回归生成；Encoder-Decoder 先编码输入，再通过 Cross-Attention 条件生成输出。选型要看输出形态和推理方式，“理解、生成、条件生成”是常见偏好，不是互斥边界。

## 核心回答

Encoder-Only 模型让输入位置双向交互，擅长得到上下文化表示，常用于分类、匹配和抽取。Decoder-Only 模型用因果 Mask 预测下一个 token，训练目标与开放式生成一致，适合续写、对话和上下文学习。Encoder-Decoder 模型先编码输入，再由解码器通过 Cross-Attention 条件生成，适合翻译、摘要等输入与输出边界清晰的序列到序列任务。选择应由任务目标、延迟和部署约束决定，而不是认为某一种架构在所有任务上都更强。

## 展开说明

三类架构的主要差异在注意力可见范围和信息流：

1. **Encoder-Only**：每个非 Padding token 通常可以看到整个输入，容易学习适合判别任务的表示。
2. **Decoder-Only**：第 $$t$$ 个位置只能使用此前信息，训练时可并行计算各位置损失，生成时则必须自回归展开。
3. **Encoder-Decoder**：编码器理解完整输入，解码器既看已生成前缀，也通过 Cross-Attention 读取编码结果。

现代通用生成模型常采用 Decoder-Only，是因为接口和训练目标统一、扩展到多任务较自然，并不意味着编码器或 Encoder-Decoder 已失去价值。在固定算力和专门任务上，双向编码或显式编码输入仍可能更高效。

## 工程实践

做选型时应使用同一业务数据比较质量、吞吐、首 token 延迟、总生成延迟和显存，而不是仅按参数量比较。若业务只需要向量表示或分类，直接使用生成式大模型可能增加不必要的成本；若输出很长，则还要单独估算自回归解码开销。

## 常见追问

1. **Decoder-Only 训练为什么能并行，生成却不能完全并行？** 训练时完整目标序列已知，可用因果 Mask 一次计算各位置；生成时下一个 Token 依赖刚生成的结果，只能顺序推进。
2. **BERT 的双向注意力为什么不适合直接做常规自回归生成？** 预训练时每个位置可利用左右上下文，与只能看前缀的生成条件不一致；它更自然地用于编码或掩码补全。
3. **Encoder-Decoder 中 Cross-Attention 的 Key 和 Value 来自哪里？** Query 来自 Decoder 当前隐藏状态，Key 和 Value 来自 Encoder 输出，使生成端可条件化于完整输入。

## 一句话复习

> Encoder-Only 偏理解，Decoder-Only 偏自回归生成，Encoder-Decoder 显式连接输入理解与条件生成。

## 参考资料

- 面试主题：[Datawhale 的 LLM、VLM 与 Agent 面试问题总结](https://github.com/datawhalechina/hello-agents/blob/main/Extra-Chapter/Extra01-%E9%9D%A2%E8%AF%95%E9%97%AE%E9%A2%98%E6%80%BB%E7%BB%93.md)
- 技术依据：[BERT](https://arxiv.org/abs/1810.04805)、[GPT-2 技术报告](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)、[T5](https://arxiv.org/abs/1910.10683)
