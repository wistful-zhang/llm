---
title: "语言模型的 Softmax Bottleneck 是什么？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "LLM 基础"
difficulty: "困难"
tags:
  - Softmax Bottleneck
  - 矩阵秩
  - LM Head
published: true
verified: true
date: 2026-07-14
---

## 核心回答

Softmax Bottleneck 指线性 LM Head 对条件分布表达秩的限制。把 `M` 个上下文隐藏状态堆成 `H ∈ R^{M×d}`，输出权重写成 `W ∈ R^{V×d}`，则 logits 矩阵 `Z=HW^T` 的秩至多为 `d`。逐行 LogSoftmax 只是再减去每行的归一化常数，因此模型可表达的 log-probability 矩阵秩至多约为 `d+1`。

真实语言中，不同上下文到词表分布的结构可能需要更高秩；当 `d` 明显小于这种有效秩时，仅靠线性投影加 Softmax 无法精确表示目标分布。这是表示能力问题，不是 Softmax 数值溢出问题。

## 展开说明

对上下文 `i` 和词 `j`，有 `log p(j|i)=h_i^T w_j-log Σ_k exp(h_i^T w_k)`。第一项组成低秩矩阵 `HW^T`，第二项对同一行所有列相同，只增加至多一个秩一项。增加训练数据不能突破该结构上限，只能在受限函数族内找到更好解。

Mixture of Softmax 为同一上下文生成多个 Softmax 分布，再按门控权重混合；由于“概率混合后再取对数”不再等价于单个低秩 logits 矩阵，它可以表达更高秩结构。增大隐藏维度或使用更丰富的输出层也能缓解瓶颈，但会增加参数和计算。该分析最初在 RNN LM 上提出，线性输出层的秩论证同样适用于 Transformer。

## 工程实践

遇到验证困惑度平台期时，先通过宽度、数据和优化消融确认是否真受输出表达限制，不应看到 Softmax 就归因于该瓶颈。若尝试 Mixture of Softmax，应监控各分量是否坍缩为相同分布，并评估训练与推理的额外成本。大词表模型还需比较 Adaptive Softmax、分词方案和 Weight Tying 的影响。

## 常见追问

1. **为什么 LogSoftmax 后秩上界可能多一？** 每行减去一个归一化标量，相当于加入“行向量乘全一列向量”的秩一矩阵，因此上界从 `d` 变为至多 `d+1`。
2. **把词表变大能解决瓶颈吗？** 不一定。词表变大增加列数，却不提高由隐藏维度决定的 logits 秩上限，甚至可能让差距更明显。
3. **它与 Softmax 数值稳定问题有什么区别？** 数值稳定关注指数溢出，可用减最大值解决；Softmax Bottleneck 是模型分布族的秩受限，数值技巧不能消除。

## 一句话复习

> 线性 LM Head 使跨上下文的 logits 秩不超过隐藏维度，LogSoftmax 只多至多一个秩，这就是 Softmax 的表示瓶颈。

## 参考资料

- [Breaking the Softmax Bottleneck: A High-Rank RNN Language Model](https://arxiv.org/abs/1711.03953)
