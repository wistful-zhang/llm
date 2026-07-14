---
title: "输入 Embedding 与 LM Head 为什么常共享权重？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "LLM 基础"
difficulty: "简单"
tags:
  - Embedding
  - LM Head
  - Weight Tying
published: true
verified: true
date: 2026-07-14
---

## 核心回答

设词表大小为 `V`、隐藏维度为 `d`，输入嵌入矩阵可写成 `E ∈ R^{V×d}`。模型读取 token `x` 时取出 `E[x]`；输出层则把末层隐藏状态 `h ∈ R^d` 投影成词表 logits。若共享权重，输出计算为 `z = E h + b`，不再训练独立的 `W_out ∈ R^{V×d}`。在常见 `Linear(d,V)` 的存储约定中 LM Head 权重就是同一个 `V×d` Parameter；只有把词向量按列写成 `d×V` 时，公式才记为 `Eᵀh`，不能混用两套约定。

这样通常能少用约 `Vd` 个参数，并让同一组词向量同时受到“作为输入如何表示”和“作为输出如何被预测”两条训练信号约束。它是一种有效的参数共享与归纳偏置，但不是任何架构都必须采用：输入、输出词表不同，或隐藏维度与嵌入维度不一致时，需要独立矩阵或额外投影。

## 展开说明

不共享时，可写为 `e_x = E_in[x]`、`z = W_out h + b`，两张大矩阵分别包含 `Vd` 个参数；共享后令 `W_out = E_in`，参数从约 `2Vd` 降为 `Vd`，偏置不受影响。由于交叉熵会对所有词表 logits 产生梯度，共享矩阵既接收输入端被查表位置的梯度，也接收输出分类器方向的梯度。

共享并不意味着输入语义与输出决策完全相同。Transformer 中间层仍可把输入表示变换到适合预测的空间，LM Head 前也可增加归一化或投影。若模型使用 factorized embedding、不同的源/目标词表、多模态新增 token，能否直接共享取决于维度和 token 对齐关系。

## 工程实践

实现时应检查框架是真正引用同一 Parameter，还是仅在初始化时复制了数值；保存、加载、量化和 LoRA 注入后也要复查别名关系。扩词表时输入 Embedding 和 LM Head 必须同步扩展；若二者共享，通常只需初始化同一批新行。比较方案时同时记录参数量、验证损失和下游表现，不应只因节省显存就断言共享一定更好。

## 常见追问

1. **共享权重能少多少参数？** 若原本输入矩阵和输出矩阵都为 `V×d`，共享后少一张矩阵，即约 `Vd` 个参数；输出 bias 通常仍独立保留。
2. **两条梯度会不会互相冲突？** 可能存在取舍，但共同优化也构成有用的正则化。是否获益依赖数据、模型容量和任务，应该通过消融确认。
3. **隐藏维度和 Embedding 维度不同还能共享吗？** 不能直接相等共享，可先用一个投影把隐藏状态映射到嵌入维度，或保留独立 LM Head。

## 一句话复习

> Weight Tying 用同一张 `V×d` 矩阵完成 token 查表和词表预测，节省约 `Vd` 参数，并耦合输入表示与输出分类器的学习。

## 参考资料

- [Using the Output Embedding to Improve Language Models](https://arxiv.org/abs/1608.05859)
- [Tying Word Vectors and Word Classifiers: A Loss Framework for Language Modeling](https://arxiv.org/abs/1611.01462)
