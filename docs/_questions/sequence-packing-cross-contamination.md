---
title: "Sequence Packing 如何用 Block-diagonal Mask 提速并避免样本污染？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "预训练与数据"
difficulty: "中等"
tags:
  - Sequence Packing
  - Attention Mask
  - 训练吞吐
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

先讲收益：把多条短样本塞进同一固定长度序列，减少 Padding，提升有效 Token 比例。然后立刻补上正确性条件——不同样本之间必须用 Block-diagonal Causal Mask 隔开，位置与损失边界也要处理。

深挖通常会问 EOS 是否足够。答案是否定的：仅插 EOS 仍允许后一个样本注意前一个样本，造成跨样本污染；需要框架或内核真正支持分段边界。

**可以这样答：**

> Sequence Packing 把多条短样本拼进一个长序列，减少 Padding，从而提高训练吞吐。但拼接后不能只加 EOS：若仍使用普通因果 Mask，后面的样本会看到前一条样本。正确做法是为每个片段建立块对角因果 Mask，按样本重置或正确编码位置，并设置对应 Loss Mask。验收既要看有效 Token 比例和吞吐，也要用单样本对照确认 Logits 没被邻居污染。

## 核心回答

Sequence Packing 把多个短样本装入同一个固定长度训练块，减少 Padding token 和空算力。若这些样本在语义上必须独立，就要同时维护三类边界：Block-diagonal Causal Mask 阻止跨样本注意力、Position IDs 在每个样本起点重置、Loss Mask 只保留应训练的目标 token。只拼接 `input_ids` 而遗漏任一边界，可能造成隐蔽的数据污染。

但跨文档注意力并非永远错误。连续语言模型预训练常用 EOS 连接文档，并允许后文看到前文；独立指令样本、分类样本或有隐私边界的数据则通常不应互看。是否隔离必须由数据语义决定，而不是把某一种 Mask 规则绝对化。

## 展开说明

若批内样本长度为 `l_1...l_k`，普通 Padding 的有效率是 `Σl_i/(k·L_max)`；Packing 可让一个长度 `L` 的块接近装满，提升有效 token 比例。装箱可用 first-fit decreasing 等近似算法，不必求解昂贵的最优 Bin Packing。

对于独立因果样本，Attention Mask 应在每个样本块内为下三角、块间为零；labels 仍按各块内部右移。SFT 还要把用户提示和 Padding 的 label 设为忽略值。支持 varlen Attention 的 Kernel 可用累计长度描述边界，避免真的物化巨大 Block-diagonal Mask。

## 工程实践

为每个 pack 保存 sample id、起止 offset、position id 和 label mask，并写单元测试检查任意 token 不能看到其他独立样本。统计有效 token 比、Pack 数、长度分布和截断率；吞吐提升应以有效训练 token/s 衡量。分布式场景还要保证每个 Rank 的有效 token 数相近，否则 Packing 反而造成负载不均。

## 常见追问

1. **Packing 与普通 Concatenation 有什么区别？** Concatenation 只连接 token；严格 Packing 还携带样本边界、位置和损失信息，可选择是否隔离跨样本 Attention。
2. **Position IDs 必须在每段重置吗？** 独立样本通常重置以匹配单独训练语义；连续文档流可保持递增，具体取决于位置方案和训练目标。
3. **只用 EOS 分隔就能避免相互污染吗？** 不能。EOS 是模型可见 token，不是硬访问控制；若要求独立，仍需 Block-diagonal Attention Mask。

## 一句话复习

> Packing 通过把短样本装满训练块提升有效 token 率；独立样本还必须同步处理 Attention、Position 和 Loss 三类边界。

## 参考资料

- [Efficient Sequence Packing without Cross-contamination](https://arxiv.org/abs/2107.02027)
