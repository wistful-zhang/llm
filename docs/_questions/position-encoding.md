---
title: "Transformer 为什么通常需要显式位置信息？"
source: "公开面经高频主题；答案依据论文和官方文档原创整理"
verified: true
review_status: "待复习"
category: "LLM 基础"
difficulty: "简单"
tags:
  - Transformer
  - 位置编码
published: true
date: 2026-07-13
---

## 核心回答

不含位置输入和 Mask 的全注意力算子具有置换等变性：它只根据 token 内容之间的关系计算权重，没有显式的“第几个位置”概念。位置编码或其他位置机制把顺序、距离等信息注入表示，使模型能区分词相同但顺序不同的序列。

## 展开说明

常见代表方案包括：

1. **绝对位置编码**：为每个位置提供向量，例如固定的正弦、余弦编码或可学习的位置向量。
2. **相对位置编码**：直接表达两个 token 之间的相对距离，更贴近注意力中的两两关系。
3. **旋转位置编码（RoPE）**：按位置旋转 Query 和 Key，使注意力内积带上相对位移信息；它与相对位置思想存在重叠，并不是完全互斥的第三类。

因果 Mask 的首要作用是限制可见性，它也会泄露部分顺序和位置信号；NoPE 因果模型甚至可以从这种结构中学到隐式位置信息。但这不等同于显式位置编码，传统 Transformer 通常仍会加入专门的位置机制。不同方案在训练长度、外推能力、计算成本和模型兼容性上各有取舍。

## 工程实践

扩展上下文长度时不能只把配置中的最大长度改大。需要检查位置编码方案是否支持外推，并用长文档检索、多跳问答和原长度任务一起回归，避免长上下文提升后短文本能力下降。

## 常见追问

1. 正弦位置编码与可学习位置编码有什么区别？
2. RoPE 为什么能表示相对位置？
3. 只有因果 Mask、没有位置编码会怎样？

## 一句话复习

> Attention 负责找相关内容，位置编码负责告诉模型这些内容按什么顺序出现。

## 参考资料

- 面经主题：[Datawhale 的 LLM、VLM 与 Agent 面试问题总结](https://github.com/datawhalechina/hello-agents/blob/main/Extra-Chapter/Extra01-%E9%9D%A2%E8%AF%95%E9%97%AE%E9%A2%98%E6%80%BB%E7%BB%93.md)
- 技术依据：[Attention Is All You Need](https://arxiv.org/abs/1706.03762)、[RoFormer](https://arxiv.org/abs/2104.09864)、[NoPE 模型的位置学习分析](https://arxiv.org/abs/2203.16634)、[Position Interpolation](https://arxiv.org/abs/2306.15595)
