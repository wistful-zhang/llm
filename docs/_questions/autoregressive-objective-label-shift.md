---
title: "自回归语言模型的训练目标与 Label Shift 是什么？"
source: "用户提供的分级面试题单；具体公司归属未独立核验，技术答案依据原论文整理"
verified: true
review_status: "待复习"
category: "LLM 基础"
difficulty: "中等"
study_tier: "core"
tags:
  - 自回归训练
  - Label Shift
  - Causal LM
published: true
answer_status: complete
date: 2026-07-14
---

## 面试时怎么答

这道题最好现场写一行移位示例：输入 `[BOS, 我, 爱]`，标签是 `[我, 爱, 你]`，位置 t 预测下一个 Token。再写负对数似然目标，并说明 Causal Mask 防止看未来。若追问 Padding 或 SFT Prompt，区分输入仍可被关注与标签是否计入 loss。

**可以这样答：**

> 自回归语言模型最小化每个 Token 在其前缀条件下的负对数似然，即 $$-\sum_t \log p(x_t \mid x_{<t})$$。实现时输入与标签错开一位，例如输入 `[BOS, 我, 爱]`，对应标签 `[我, 爱, 你]`；Causal Mask 阻止当前位置看到未来。Padding 和不需要监督的 Prompt 位置通常用 loss mask 排除，但仍可以作为上下文被后续 Token 关注。

## 核心回答

自回归语言模型把序列联合概率按从左到右的条件概率分解：

$$
p_\theta(x_1, \ldots, x_T)
= \prod_{t=1}^{T} p_\theta(x_t \mid x_{<t})
$$

训练时最小化有效目标 token 的负对数似然：

$$
\mathcal{L}
= -\frac{\sum_t m_t \log p_\theta(x_t \mid x_{<t})}
        {\sum_t m_t}
$$

其中 $$m_t$$ 是 Loss Mask。概念上，位置 $$t-1$$ 的输出预测位置 $$t$$ 的 token，这就是 Label Shift。很多 Causal LM API 允许传入 `labels = input_ids`，并在模型内部完成 Logit 与 Label 的错位；另一些训练代码会在外部显式切片。必须检查具体 API，不能内外各 Shift 一次。

EOS 是模型需要学习预测的正常目标 token；Padding 只是批处理对齐，不属于原始内容，通常把对应 Label 设为忽略值，例如 `-100`。Attention Mask 控制哪些位置能被读取，Loss Mask 控制哪些目标计入损失，二者作用不同。

## 展开说明

假设训练序列是：

```text
[BOS, 今, 天, 晴, EOS]
```

概念上的输入—目标对为：

```text
输入前缀：BOS | BOS 今 | BOS 今天 | BOS 今天晴
目标 token： 今 |   天    |    晴     |    EOS
```

实际 Transformer 不需要逐前缀跑四次。借助 Causal Mask，一次前向就能并行得到各位置的下一 token Logit，再将 `logits[..., :-1, :]` 与 `labels[..., 1:]` 对齐计算损失。具体切片可能封装在模型内部。

EOS 让模型学习何时结束；若训练样本遗漏、重复或错误插入 EOS，可能导致模型过早停止或不停生成。Padding Label 通常忽略，但 Padding 位置是否可被 Attention 读取仍由 Attention Mask 决定。把所有 Label 都设为 `-100` 会使有效目标数为零；不同实现可能得到零损失或 NaN，都表示该 Batch 没有训练信号。

在 SFT 中还会进一步屏蔽 system/user/模板部分，只让 assistant 响应参与 Loss。这改变的是 $$m_t$$，没有改变自回归概率分解本身。

## 工程实践

训练前应取一条真实样本反解 Token，逐位置打印 `input_id`、目标 Label、Attention Mask 和 Loss Mask，确认模板边界、EOS、截断与 Padding 正确。再做一个小 Batch 过拟合测试：若损失不能明显下降，先检查 Shift 和 Mask，而不是立刻调学习率。还要统计每个 Batch 的有效 Label 数，避免截断后回答被全部裁掉却继续训练。

## 常见追问

1. **为什么训练时可以一次计算所有位置，而推理仍需逐 token？** 训练样本的所有正确 token 已知，Causal Mask 能在一次前向中构造每个位置的合法前缀；推理的下一个 token 未知，必须先生成再作为后续条件。
2. **`labels = input_ids` 是否意味着模型在预测当前 token？** 通常不是。许多 Causal LM 在内部用 `logits[..., :-1, :]` 对齐 `labels[..., 1:]`，使位置 $$i$$ 的 Logit 预测 token $$i+1$$；要以具体模型 API 的损失实现为准。
3. **EOS 与 Padding 在损失中的处理有什么不同？** EOS 是有语义的结束标记，通常应作为有效 Label 学习；Padding 只用于批对齐，通常在 Loss 中忽略，并用 Attention Mask 阻止错误读取。
4. **Attention Mask 和 Loss Mask 分别控制什么？** Attention Mask 决定某个位置能读取哪些输入位置；Loss Mask 决定某个目标是否贡献梯度。一个 token 可以被上下文读取，但不作为监督目标计入 Loss。
5. **Label 被外部和模型内部重复 Shift 会出现什么现象？** 监督会错位成预测更远的 token，训练 Loss 和生成质量都可能异常。最可靠的检查是反解一条样本，并核对首尾几个 Logit 实际对应的目标。

## 一句话复习

> 自回归训练让每个位置预测下一个 token；Label Shift 可由模型内部或数据管线完成一次，EOS 要学习，Padding 和非目标内容要用 Loss Mask 排除。

## 参考资料

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)
- [Hugging Face：Causal language modeling](https://huggingface.co/docs/transformers/main/tasks/language_modeling)
