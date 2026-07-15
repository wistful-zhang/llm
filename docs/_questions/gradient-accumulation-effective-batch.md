---
title: "梯度累积如何影响有效 Batch、学习率与分布式同步？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "训练工程"
difficulty: "简单"
tags:
  - 梯度累积
  - DDP
  - 有效 Batch
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

先写有效 Batch：每卡 Micro-batch × 累积步数 × 数据并行卡数。然后说明前几次反向只累加，最后一次才同步并更新。容易被追问的是 loss 缩放与变长序列：若目标是全局 Token 平均，就不能简单对每个 Micro-batch 的均值再平均；还要说明更新次数减少后学习率日程的计数口径。

**可以这样答：**

> 梯度累积的有效 Batch 等于每卡 Micro-batch、累积步数和数据并行卡数三者之积。前几次反向只把梯度加到参数上，通常用 `no_sync` 避免每次通信，最后一次才做全局同步和优化器更新。若序列长度不同，最好按有效 Token 数汇总 loss，不能简单平均每个 Micro-batch 的均值；学习率日程也应按优化器更新步而非反向次数计数。

## 核心回答

若每个数据并行 Rank 的 Micro Batch 为 `b`，累积 `a` 次后更新一次，数据并行规模为 `d`，则按样本计的有效 Batch 通常是 `B = b × a × d`。梯度累积让多次 Forward/Backward 的梯度先留在参数上，最后才做一次 Optimizer Step，主要用更多计算轮次换更低峰值激活显存。

在 DDP 中，中间累积步可用 `no_sync()` 避免每次 All-Reduce，最后一步再同步。Loss 的归一化必须和目标全局平均一致；变长 SFT 若各 Micro Batch 的有效 Token 数不同，简单每步除以固定累积次数可能产生偏差，应累计 Loss Sum 与有效 Token 数后统一归一化。

## 展开说明

- `optimizer.zero_grad()` 在一轮累积开始前执行，不能在每个 Micro Batch 后清零。
- Optimizer、LR Scheduler 和全局 Step 通常在完成一整个有效 Batch 后推进一次，而不是每次 Forward 都推进。
- 使用 AMP 时先对累计梯度 `unscale_`，再做梯度裁剪，最后 `step/update`。
- 线性放大学习率只是大 Batch 的经验起点，不是定律；优化器、数据与 Warmup 改变时需要重新验证收敛。

如果最后一个有效 Batch 不满，或不同 Rank 有不同 Token 数，必须明确是按样本平均还是按非 Mask Token 平均。否则“看起来相同的有效 Batch”可能对应不同的梯度权重。

版本边界：PyTorch DDP 的 `no_sync()` 要求相关 Forward 也位于上下文中；FSDP、ZeRO 或训练框架可能封装不同的同步/归一化语义，应以所用版本实现为准。

## 工程实践

记录每次 Optimizer Step 的样本数、有效 Token 数、梯度范数、学习率和通信次数。用小模型比较“大 Batch 一次反传”和“若干 Micro Batch 累积”的梯度差异；关闭 Dropout 并固定数据顺序后，差异应仅来自浮点归约顺序和实现允许的数值误差。

## 常见追问

1. **为什么累积 8 步不代表显存可以支持 8 倍模型？**  它主要减少单步激活与输入占用，参数、梯度和 Optimizer State 仍常驻；模型本体超出显存时还需要分片、量化或 Offload。
2. **DDP 中每个累积步都 All-Reduce 有什么问题？**  数学上可以得到相近结果，但会把通信次数放大 `a` 倍；`no_sync()` 让中间梯度留在本地，最后一步统一同步。
3. **为什么变长样本不能总是把每步平均 Loss 再平均？**  每个 Micro Batch 的有效 Token 数不同，平均的平均会给小 Batch 过高权重；应按总有效 Token 对 Loss Sum 加权。

## 一句话复习

> 有效 Batch 是 Micro Batch、累积步数与数据并行规模之积，但同步、Loss 分母、Scheduler 和裁剪都必须以 Optimizer Step 为边界。

## 参考资料

- 官方文档：[PyTorch DistributedDataParallel](https://docs.pytorch.org/docs/stable/generated/torch.nn.parallel.DistributedDataParallel.html)
- 官方文档：[PyTorch Automatic Mixed Precision examples](https://docs.pytorch.org/docs/stable/notes/amp_examples.html)
