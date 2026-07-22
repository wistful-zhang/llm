---
title: "大模型训练出现 Loss 为 NaN，应该如何排查？"
source: "用户提供的分级面试题单；公司归属未独立核验，技术答案依据论文或官方文档整理"
verified: true
review_status: "待复习"
category: "训练与对齐"
difficulty: "困难"
study_tier: "core"
tags:
  - NaN
  - 训练稳定性
  - 调试
published: true
answer_status: complete
date: 2026-07-14
---

## 面试时怎么答

这题看的是定位纪律。先回到最后正常 Checkpoint，用固定数据顺序复现第一个异常 Step；随后从输入、Mask、前向激活、Logits 与 Loss、反向梯度、优化器状态依次寻找最早出现的非有限值。

若是多卡训练，必须定位首个异常 Rank，因为归约会把 NaN 扩散。也要说明梯度裁剪只能限制有限的大梯度，救不了已经在前向产生的 NaN。

**可以这样答：**

> 从最后正常 Checkpoint 恢复，固定随机数和数据顺序，二分找到首个 NaN Batch。依次检查输入与 Mask、每层激活、Logits、Loss、缩放前梯度、优化器状态和参数，记录 finite ratio、绝对最大值与梯度范数。分布式训练还要找到最早异常的 Rank，避免 All-Reduce 掩盖源头。先稳定复现，再一次只改学习率、精度或样本中的一个因素验证根因。

## 核心回答

排查 NaN 要先找到“第一个非有限值”，而不是在最终 Loss 上盲目降学习率。固定随机种子、数据顺序和检查点复现故障，然后按数据与标签、前向激活与 logits、Loss、反向梯度、优化器状态和参数的顺序逐层检查 `isfinite`。一旦确定首次异常发生在哪个 step、rank、batch 和模块，再针对数据错误、数值溢出、学习率或自定义算子处理。

Gradient Clipping 只能限制已经计算出的有限梯度，不能修复输入中的 NaN、前向溢出、全 Mask Loss 或错误 kernel。BF16 因指数范围更大通常比 FP16 少发生溢出，但它不是对坏数据、过大学习率或除零错误的通用修复。

## 展开说明

建议按以下顺序建立证据：

1. **定位边界**：保存 global step、样本 ID、数据版本、rank 和 RNG 状态；从最近正常检查点二分故障区间。
2. **检查数据与监督**：确认输入、连续特征和权重均为有限值；有效 label 数大于零；token ID、Mask、长度和截断符合约定。
3. **检查前向**：为可疑模块记录输入输出的有限值比例和范围，重点看归一化、指数、除法、Attention Mask 与自定义 kernel。
4. **检查反向**：在反向后、优化器更新前查看未缩放梯度和总范数；必要时临时启用异常检测定位产生 NaN 的算子。
5. **检查更新**：核对学习率、warmup、梯度累积的 Loss 缩放、Adam 状态和恢复检查点后的 step 是否一致。

FP16 使用 GradScaler 时，应先 `unscale_` 再做梯度裁剪或有限值检查；检测到 Inf/NaN 的更新通常应跳过并调整 scale。分布式训练还要记录每个 rank：单个 rank 的坏样本或非有限梯度可能通过集合通信污染全部副本。

## 工程实践

为训练循环增加低开销的 step、样本 ID、Loss、学习率、梯度范数和 AMP scale 日志，并在异常时自动保存最小复现包。`detect_anomaly` 和逐层 hook 开销较大，只在缩小后的窗口启用。修复后从故障前检查点用原 batch 回放，再做数百步稳定性验证，避免“跳过坏 batch 后看似恢复”掩盖根因。

## 常见追问

1. **如何定位是哪一个 Batch 导致 NaN？** 记录可复现的数据顺序和样本 ID，从最后正常检查点逐 batch 回放，并在边界处保存输入与 Mask。
2. **Gradient Clipping 能解决所有梯度爆炸吗？** 不能；它只裁剪有限梯度，若前向或 Loss 已是 NaN，裁剪没有修复作用。
3. **BF16 为什么通常比 FP16 稳定？** BF16 指数位更多、动态范围接近 FP32，较少溢出或下溢，但尾数精度更低且仍可能产生非有限值。
4. **分布式训练为什么要按 rank 排查？** 不同 rank 处理不同数据，任一 rank 的非有限梯度都可能经 All-Reduce 传播到全局。

## 一句话复习

> NaN 排障的核心是可复现地找到第一个非有限张量，再沿数据、前向、反向和更新链路定位根因。

## 参考资料

- [PyTorch：Autograd 异常检测](https://docs.pytorch.org/docs/stable/autograd.html#debugging-and-anomaly-detection)
- [PyTorch：Automatic Mixed Precision](https://docs.pytorch.org/docs/stable/amp.html)
- [PyTorch：AMP 梯度裁剪示例](https://docs.pytorch.org/docs/stable/notes/amp_examples.html#gradient-clipping)
- [PyTorch：clip_grad_norm_](https://docs.pytorch.org/docs/stable/generated/torch.nn.utils.clip_grad_norm_.html)
