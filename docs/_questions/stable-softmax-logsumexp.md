---
title: "Softmax 与 LogSumExp 如何避免数值溢出？"
source: "用户提供的分级面试题单；公司归属未独立核验，技术答案依据论文或官方文档整理"
verified: true
review_status: "待复习"
category: "训练与对齐"
difficulty: "中等"
tags:
  - Softmax
  - LogSumExp
  - 数值稳定性
published: true
answer_status: complete
date: 2026-07-14
---

## 面试时怎么答

直接写数值稳定变换最有说服力：Softmax 前给所有 Logit 减最大值，概率不变，却把最大指数变成 1；LogSumExp 则写成 m 加 log(sum(exp(x_i-m)))。

若被问低精度，补充减最大值不能消除所有下溢，工程上还会用融合 Cross-Entropy、FP32 累加与稳定的 log-softmax 内核。

**可以这样答：**

> 直接计算 exp(x) 时，大正数会溢出。因为给所有 Logit 同减一个常数不改变 Softmax，可取 m=max(x)，计算 exp(x_i-m) 再归一化，此时最大指数为 1。对应地，LogSumExp 写成 m+log(sum(exp(x_i-m)))，避免先得到巨大指数。低精度训练中还应采用稳定的 log-softmax 或融合交叉熵，并让关键归约使用更高精度累加。

## 核心回答

直接计算 $$\exp(z_i)$$ 时，大正数可能上溢，绝对值很大的负数可能下溢到零。利用 Softmax 对所有 logit 加同一个常数保持不变的性质，令 $$m = \max_j z_j$$：

$$
\operatorname{softmax}(z)_i
= \frac{\exp(z_i-m)}{\sum_j \exp(z_j-m)}
$$

此时最大的指数输入为 0，其指数为 1，不会出现大正数指数上溢。对应的稳定 LogSumExp 为：

$$
\begin{aligned}
\operatorname{LSE}(z)
  &= \log \sum_j \exp(z_j) \\
  &= m + \log \sum_j \exp(z_j-m)
\end{aligned}
$$

分类交叉熵可写成 $$\mathcal{L} = -z_y + \operatorname{LSE}(z)$$。生产代码通常直接把 logits 交给融合的 CrossEntropy 或 LogSoftmax 实现，而不是先显式算概率再取对数。

## 展开说明

平移不改变 Softmax，因为分子和分母都会乘上同一个 $$\exp(-m)$$，该因子相消。减最大值不能消除所有下溢：极小项仍可能变为零，但它们本来对归一化贡献就极小；关键是避免主导项上溢并让分母至少包含一个值为 1 的项。

FP16 的指数范围比 BF16/FP32 窄，因此更容易在大 logits 或大幅梯度下溢出；稳定公式仍应使用，而不是把 dtype 提升当作替代方案。Mask 还会引入特殊边界：若一整行都被设为 $$-\infty$$，则 $$m = -\infty$$，执行 $$z-m$$ 可能出现未定义结果。实现必须保证每个有效 Query 至少有可见位置，或显式处理全 Mask 行。

## 工程实践

保留原始 logits，使用框架提供的 `cross_entropy`、`log_softmax` 或 `logsumexp`。调试时分别记录有限值比例、每行最大/最小 logit、全 Mask 行和 loss reduction 的分母；不要只在最终 Loss 变成 NaN 后才排查。自定义融合 kernel 要和 FP32 参考实现比较极端输入、Mask 与梯度。

## 常见追问

1. **为什么减去最大值不改变 Softmax？** 所有指数项同乘 $$\exp(-m)$$，分子与分母中的公共因子会相消。
2. **为什么不减去平均值？** 减平均值保持结果不变，但不能保证最大指数输入不大于 0，因此不能可靠避免上溢。
3. **LogSoftmax 为什么通常比 $$\log(\operatorname{softmax}(x))$$ 稳定？** 它直接用 $$z_i - \operatorname{LSE}(z)$$ 计算，避免先形成可能舍入为零的概率再取对数。
4. **减最大值后还可能出现 NaN 吗？** 可能，例如输入已有 NaN/Inf、整行全被 Mask，或后续 reduction 分母为零。

## 一句话复习

> 稳定 Softmax 先减行最大值，稳定对数归一化使用 LogSumExp，并对全 Mask 行和低精度边界做显式保护。

## 参考资料

- [PyTorch：torch.logsumexp](https://docs.pytorch.org/docs/stable/generated/torch.logsumexp.html)
- [PyTorch：torch.nn.functional.log_softmax](https://docs.pytorch.org/docs/stable/generated/torch.nn.functional.log_softmax.html)
- [PyTorch：CrossEntropyLoss](https://docs.pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html)
