---
title: "Causal Mask、Padding Mask 和样本边界 Mask 分别解决什么问题？"
source: "公开大模型开发岗真实面试案例中的 Attention Mask 题；答案依据 Transformer 论文与 PyTorch 官方文档原创整理"
review_status: "待复习"
category: "LLM 基础"
difficulty: "简单"
tags:
  - Attention Mask
  - Causal LM
  - 数据打包
published: true
verified: true
date: 2026-07-13
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论：** Causal Mask 控制可见未来，Padding Mask 屏蔽填充位，样本边界 Mask 防止打包样本互相读取。
2. **再讲关键机制：** 用注意力 logits 加 `0/-∞` 解释三种 Mask 的作用，并区分它们与 loss label mask。
3. **主动说取舍：** Mask 组合灵活，但形状、广播和布尔语义很容易写反，Flash Kernel 还可能有格式限制。
4. **最后落到项目：** 用小矩阵单测和 packed 数据回归，检查泄漏率、有效 token 比例和吞吐；讲完停。

**60 秒口述示例：**

> 我会先分别回答：Causal Mask 让位置只能看自己和过去；Padding Mask 不让真实 token 关注补齐位；样本边界 Mask 在 sequence packing 时阻断跨样本注意力。它们作用于 attention logits，和把标签设为 -100 不同。工程上我会用可手算的小矩阵测广播方向，并监控跨样本泄漏必须为零、有效 token 比例和训练吞吐。 最后补一句，三种 Mask 必须分别单测。


## 核心回答

Causal Mask 限制当前位置不能读取未来 token，保证自回归训练与生成的因果性；Padding Mask 屏蔽为了对齐 Batch 而补出的空位置，避免它们参与注意力；把多条语义独立样本打包到同一物理序列、又要求彼此不可见时，还需要样本边界 Mask。实现上通常在 Softmax 前把不允许关注的位置加上极小值，使其归一化后的权重接近零。

## 展开说明

以长度为 `n` 的 Decoder-Only 序列为例，Causal Mask 通常是下三角可见矩阵：位置 `i` 只能关注不晚于 `i` 的位置。Padding Mask 的形状往往由有效长度生成，再广播到 Head 和 Query 维度。若要求各样本注意力独立，打包时仅有 Causal Mask 不够，因为后一条样本仍可能看到前一条无关样本；应使用块对角边界，或由支持文档边界的注意力实现处理。连续语言模型训练也可能用 EOS 分隔文档并允许跨文档注意，这属于不同的数据语义。

Mask 还必须和损失 Mask 区分：前者控制模型能看什么，后者控制哪些 token 计入训练损失。把两者混淆，可能造成标签泄漏、无效 token 参与训练，或整行被屏蔽后出现数值异常。

## 工程实践

应为短样本手工打印注意力可见矩阵，并验证左 Padding、右 Padding、序列打包和缓存解码的行为。使用 FlashAttention 或其他融合内核时，要确认其因果方向和长度参数约定；不同库对布尔 Mask 中 `true` 的含义也可能相反，不能只凭名称猜测。

## 常见追问

1. **为什么训练时用了 Causal Mask 仍可并行计算所有位置？** Mask 只是把未来位置的注意力 logit 置为负无穷，整张矩阵仍能一次并行计算；串行的是自回归推理时未知的下一 Token。
2. **Attention Mask 与把标签设为 `-100` 有什么区别？** 前者决定前向时每个位置能看什么，后者只决定哪些位置计入 loss；只 mask 标签不能阻止信息被读取。
3. **多条对话打包后，怎样避免跨样本信息泄漏？** 构造块对角的样本边界 Mask，并独立重置位置或按模型要求编码，同时对 padding 和标签分别处理。

## 一句话复习

> Causal Mask 管未来，Padding Mask 管补位，样本边界 Mask 管打包后的跨样本隔离。

## 参考资料

- 面试主题：[AgentGuide 大厂真实面经案例集](https://github.com/adongwanai/AgentGuide/blob/main/docs/04-interview/12-company-interview-cases.md)
- 技术依据：[Attention Is All You Need](https://papers.neurips.cc/paper/7181-attention-is-all-you-need.pdf)、[PyTorch Scaled Dot Product Attention](https://docs.pytorch.org/docs/stable/generated/torch.nn.functional.scaled_dot_product_attention.html)
