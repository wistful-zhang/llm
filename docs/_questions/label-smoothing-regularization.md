---
title: "Label Smoothing 如何修改训练目标，为什么可能改善泛化却损害校准或蒸馏？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "训练与对齐"
difficulty: "中等"
tags:
  - Label Smoothing
  - 交叉熵
  - 校准
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论：** Label Smoothing 把 one-hot 目标与平滑分布混合，抑制过度自信并正则化分类边界。
2. **再讲关键机制：** 写出 `q'=(1-ε)q+εu`，说明交叉熵不再只奖励真实类别，且等价于额外约束输出分布。
3. **主动说取舍：** 它可能提升准确率，但会改变置信度和类间结构，过大 ε 会伤害难例、蒸馏与概率解释。
4. **最后落到项目：** 扫描 ε，报告准确率/NLL、ECE、少数类 Recall 和 Teacher 软标签质量；讲完停。

**60 秒口述示例：**

> 我会先说 Label Smoothing 不再把正确类目标设为 1、其他类全为 0，而是用 `(1-ε)` 的 one-hot 加 `ε` 的均匀或先验分布。这样模型没必要把正确类 logit 推到无限大，常能缓解过度自信并提高泛化。代价是概率含义和类间信息会改变。项目里我会扫描 ε，同时看准确率、NLL、ECE、少数类 Recall 和蒸馏效果。 还要按类别检查是否系统性欠置信。

## 核心回答

K 类分类中，原目标 q 为 one-hot。Label Smoothing 构造 `q'=(1-ε)q+εu`，u 常取均匀分布；不同实现会把 ε 分到全部 K 类，或只分到 K-1 个错误类，使用时必须核对。训练仍最小化 `H(q',p)=-Σ_k q'_k log p_k`。

平滑目标减少把正确类概率推向 1 的压力，限制极端 logit，常表现为正则化。它也可分解为原 one-hot 交叉熵与对平滑先验的交叉熵组合，因此改变的不是数据，而是监督目标。

## 展开说明

Label Smoothing 可能改善 top-1 准确率和泛化，但“改善校准”不是必然。它直接压低置信度，某些设置下 ECE 变好，另一些分布或强度下会欠置信。蒸馏中 Teacher 的类间相似度来自软输出，过度平滑训练出的 Teacher 可能丢失有用的相对 logit 结构。

有标签噪声时，平滑可降低单个硬标签的支配；但它不区分可信与可疑样本，也可能削弱稀有类监督。类别不平衡任务可把 u 设为先验分布，但要防止进一步偏向多数类。

## 工程实践

确认框架 `label_smoothing` 的分配定义、`ignore_index` 和 reduction 口径。固定其他正则化，扫描 ε 与学习率，按类别和置信度分桶看准确率、NLL、Brier Score、ECE。用于生成模型时只对有效 label token 计算，避免把 padding 或被 mask 的提示位置纳入平滑。

## 常见追问

1. **ε 等于 0 时是什么？** 目标退化为原始 one-hot，损失就是普通交叉熵。
2. **Label Smoothing 等同于降低 Softmax 温度吗？** 不等同。前者修改训练目标分布；温度缩放修改 logits，常在训练后用于校准或在采样时控制分布。
3. **为什么可能伤害知识蒸馏？** Teacher 被训练得不再表达清晰的错误类别相对关系，Student 从软标签中获得的“暗知识”可能减少。
4. **类别不平衡时能直接用均匀平滑吗？** 可以作为基线，但可能不符合真实先验；应与 class weight、重采样及类别先验平滑做分桶比较。

## 一句话复习

> Label Smoothing 用软目标抑制极端自信，可能换来泛化，也可能牺牲校准与类间软信息。

## 参考资料

- [Rethinking the Inception Architecture for Computer Vision](https://arxiv.org/abs/1512.00567)
- [When Does Label Smoothing Help?](https://arxiv.org/abs/1906.02629)
