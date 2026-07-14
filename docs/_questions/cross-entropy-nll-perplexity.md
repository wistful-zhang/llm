---
title: "交叉熵、负对数似然与 Perplexity 有什么关系？"
source: "用户提供的分级面试题单；具体公司归属未独立核验，技术答案依据原论文整理"
verified: true
review_status: "待复习"
category: "LLM 基础"
difficulty: "中等"
tags:
  - 交叉熵
  - NLL
  - Perplexity
published: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论：** 对 one-hot 标签，交叉熵就是正确 Token 的负对数似然；Perplexity 是平均 NLL 的指数。
2. **再讲关键机制：** 写出 `L=-1/N Σ log p(x_t|x_<t)` 与 `PPL=exp(L)`，说明按有效 token 平均。
3. **主动说取舍：** PPL 便于同一 tokenizer 和数据集内比较，但跨 tokenizer、不同预处理时不可直接横比。
4. **最后落到项目：** 核对 loss mask、对数底和 token 口径，并报告 PPL、有效 token 数和分桶结果；说完停。

**60 秒口述示例：**

> 我会先把三者串起来：最大似然等价于最小化 NLL；标签是 one-hot 时，NLL 就是预测分布和标签的交叉熵；对每个有效 token 的平均 NLL 取指数就是 PPL。PPL 越低表示模型给真实序列更高概率。取舍是它受 tokenizer 和数据分布影响。项目里我会固定切词与 mask，报告总 PPL、有效 token 数和长度、领域分桶。 跨模型比较前我会先核对 tokenizer。


## 核心回答

模型先为词表输出 Logit `z`，Softmax 得到概率 `p_k = exp(z_k) / Σ_j exp(z_j)`。当真实类别是 token `y` 时，One-hot 目标与预测分布的交叉熵为：

```text
CE = -Σ_k 1[k=y] log p_k = -log p_y
```

它正是这个观测 token 的负对数似然（NLL）。对所有有效 token 取平均得到语言模型常说的 Cross-Entropy Loss。若使用自然对数且平均损失为 `L`，则：

```text
Perplexity = exp(L)
```

Perplexity 越低，表示模型平均给真实下一个 token 分配的概率越高；它不是准确率，也不能单独衡量事实性、指令遵循或生成质量。

## 展开说明

对序列 `x₁:T`，总 NLL 是：

```text
NLL(x₁:T) = -Σ_t log pθ(x_t | x_<t)
```

除以有效 token 数得到平均 Token NLL，也就是通常报告的 Loss；再取指数得到 PPL。若对数以 2 为底，则对应 `2^L`，所以比较前要确认对数底和归约方式。实现通常把 `LogSoftmax + NLLLoss` 合成稳定的 CrossEntropyLoss，避免先显式计算很小的概率再取对数。

不同 Tokenizer 的 PPL 通常不能直接横向比较：同一段原始文本会被切成不同数量和粒度的 token，平均 NLL 的计量单位变了。若必须跨 Tokenizer 比较，可以在同一原始文本上报告按字节或字符归一化的负对数似然，并明确 Unicode 规范化、空格和边界处理；这仍不能替代下游任务评测。

对固定上下文窗口模型评估长文本时，不能把不重叠小段完全独立处理后假装每个 token 都拥有完整历史。滑动窗口评估通常更接近真实条件概率，但重叠和边界必须避免重复计数。

## 工程实践

记录 Loss 时同时记录有效 token 数，而不是简单平均每个 Batch 的均值，否则不同长度 Batch 会得到偏置结果。检查框架的 `ignore_index`、Label Smoothing 和 Reduction 设置；这些都会改变“Loss 是否等于纯 NLL”的严格含义。模型选择还应结合任务成功率、安全、校准和人工评审，避免只优化 PPL。

## 常见追问

1. **为什么 One-hot Label 下交叉熵等于真实 token 的 NLL？** One-hot 分布只有真实类别的权重为 1，交叉熵求和后只剩 `-log p_y`，恰好是该观测在模型下的负对数似然。
2. **Logit、概率和 Label 分别是什么？** Logit 是 LM Head 输出的未归一化分数，概率是 Logit 经 Softmax 后的分布，Label 是当前位置要预测的真实 token ID 或目标分布。
3. **为什么不同 Tokenizer 的 Perplexity 不能直接比较？** Tokenizer 改变了序列分段和平均损失的单位，一个 token 可能代表不同数量的字符或字节。跨 Tokenizer 时应改用明确的字节/字符归一化指标并固定原始文本。
4. **Label Smoothing 后交叉熵还等于单一真实类别的 NLL 吗？** 不严格等于。平滑后的目标在其他类别上也有非零质量，Loss 变成目标分布与预测分布的交叉熵，而不只是 `-log p_y`。
5. **Perplexity 下降为什么不保证对话体验一定提升？** PPL 只衡量参考文本上的下一 token 概率，不能直接覆盖事实性、安全、格式遵循和用户偏好。它需要与生成式任务指标和人工评测结合。

## 一句话复习

> One-hot 下一 token 训练中，交叉熵就是真实 token 的负对数似然，平均 Token NLL 取指数得到 PPL，但计量依赖 Tokenizer 与归约方式。

## 参考资料

- [A Neural Probabilistic Language Model](https://www.jmlr.org/papers/volume3/bengio03a/bengio03a.pdf)
- [PyTorch：CrossEntropyLoss](https://docs.pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html)
- [Hugging Face：Perplexity of fixed-length models](https://huggingface.co/docs/transformers/main/perplexity)
