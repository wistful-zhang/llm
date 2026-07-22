---
title: "LoRA 的低秩更新原理是什么，为什么一个矩阵常零初始化？"
source: "用户提供的分级面试题单；公司归属未独立核验，技术答案依据论文或官方文档整理"
verified: true
review_status: "待复习"
category: "训练与对齐"
difficulty: "中等"
study_tier: "core"
tags:
  - LoRA
  - 低秩微调
  - 参数高效微调
published: true
answer_status: complete
date: 2026-07-14
---

## 面试时怎么答

LoRA 原理题先写 $$\Delta W = BA$$ 与 $$\alpha/r$$，再说低秩分解如何减少可训练参数。零初始化一侧的目的，是让训练起点 $$\Delta W = 0$$ 不扰动基座；还要解释为何 A 随机、B 为零时 B 先获得梯度、随后 A 也能学习，这通常就是面试官的第二问。

**可以这样答：**

> LoRA 冻结基座权重 W，只学习低秩增量 $$\Delta W = BA$$，并用 $$\alpha/r$$ 调节更新尺度。常把 A 随机初始化、B 设为零，使训练开始时 $$\Delta W = 0$$，模型输出与基座一致；第一步 B 能获得梯度，B 更新后 A 也会得到非零梯度。低秩能显著减少训练参数，但 Rank 太小可能表达不了任务需要的更新。

## 核心回答

LoRA 冻结预训练权重 $$W_0$$，不直接学习同形状的完整更新，而是假设任务所需的更新可以用低秩矩阵近似。若 $$W_0 \in \mathbb{R}^{d_{\mathrm{out}} \times d_{\mathrm{in}}}$$，可写成：

$$
\begin{aligned}
y &= W_0x + \frac{\alpha}{r}BAx, \\
A &\in \mathbb{R}^{r \times d_{\mathrm{in}}}, \qquad
B \in \mathbb{R}^{d_{\mathrm{out}} \times r}, \\
r &\ll \min(d_{\mathrm{in}}, d_{\mathrm{out}})
\end{aligned}
$$

因此每层可训练参数从 $$d_{\mathrm{out}} \times d_{\mathrm{in}}$$ 降为 $$r(d_{\mathrm{in}}+d_{\mathrm{out}})$$。常见初始化让 $$A$$ 随机、$$B$$ 为零，使训练起点满足 $$BA=0$$，模型一开始与原模型完全一致；同时随机的 $$A$$ 让 $$B$$ 在第一次反向传播时能获得非零梯度。不同库可能交换 $$A/B$$ 的命名，关键是“一侧随机、一侧为零”。

## 展开说明

低秩更新是一种经过实验支持的建模假设，不是所有任务更新都必然严格低秩。它把可学习方向限制在较小子空间，以显著减少梯度与优化器状态，同时保留原模型参数。$$r$$ 控制最大秩，$$\alpha/r$$ 控制更新分支的尺度；二者的详细选取应通过目标任务和通用能力回归确定。

若 $$A$$ 和 $$B$$ 都初始化为零，则在 $$BA$$ 这个双线性参数化中，$$\partial \mathcal{L}/\partial A$$ 含有 $$B$$，$$\partial \mathcal{L}/\partial B$$ 含有 $$A$$，两边的初始梯度都为零，训练无法正常启动。若两边都随机，虽然有梯度，但初始 $$BA$$ 通常不为零，会在训练第一步前就扰动基座输出。

## 工程实践

实现时先核对库对矩阵方向、缩放方式和初始化器的约定，再用固定输入验证“加载未训练适配器前后 logits 一致”。训练中记录 LoRA 分支的梯度范数、更新范数与基座权重范数之比；如果参数显示可训练但梯度始终为零，应检查 target module、冻结配置、计算图和零初始化是否放错了两侧。

## 常见追问

1. **为什么两个矩阵不能都初始化为零？** 因为 $$BA$$ 的两侧会互相阻断初始梯度，二者都无法离开零点。
2. **为什么要保证训练开始时 $$\Delta W = 0$$？** 这样初始模型严格继承基座能力，训练曲线的变化来自数据更新而不是随机适配器扰动。
3. **低秩假设是否意味着完整权重更新的秩一定很低？** 不是；它是有效的参数化约束，最佳秩取决于任务、层和数据规模。
4. **LoRA 会减少一次前向中的基座矩阵乘吗？** 不会；训练时仍要计算冻结的基座分支，只是无需为其保存参数梯度和优化器状态。

## 一句话复习

> LoRA 用 $$\Delta W = (\alpha/r)BA$$ 近似完整更新，并用“一侧随机、一侧为零”同时保证零扰动起点和可传播的初始梯度。

## 参考资料

- [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685)
- [Hugging Face PEFT：LoRA API](https://huggingface.co/docs/peft/main/en/package_reference/lora)
