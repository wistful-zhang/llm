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
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

Label Smoothing 最好先写出平滑后的目标分布，再解释它为何阻止正确类 logit 被无限推高。回答不能停在“防过拟合”，还要指出它会改变概率语义和类间结构，过大的 ε 可能伤害难例、校准和蒸馏；面试官若追问，可比较均匀先验与类别先验。

**可以这样答：**

> Label Smoothing 把 one-hot 目标改成 $$(1-\varepsilon)q+\varepsilon u$$，让正确类不再是 1、其他类也不全为 0。这样模型没必要无限拉大正确类 logit，常能减轻过度自信并改善泛化。代价是目标概率的含义被改变；$$\varepsilon$$ 过大时，难例、少数类、校准以及 Teacher 的类间软信息都可能受损。

## 核心回答

$$K$$ 类分类中，原目标 $$q$$ 为 one-hot。Label Smoothing 构造 $$q'=(1-\varepsilon)q+\varepsilon u$$，$$u$$ 常取均匀分布；不同实现会把 $$\varepsilon$$ 分到全部 $$K$$ 类，或只分到 $$K-1$$ 个错误类，使用时必须核对。训练仍最小化 $$H(q',p)=-\sum_k q'_k\log p_k$$。

平滑目标减少把正确类概率推向 1 的压力，限制极端 logit，常表现为正则化。它也可分解为原 one-hot 交叉熵与对平滑先验的交叉熵组合，因此改变的不是数据，而是监督目标。

## 展开说明

Label Smoothing 可能改善 top-1 准确率和泛化，但“改善校准”不是必然。它直接压低置信度，某些设置下 ECE 变好，另一些分布或强度下会欠置信。蒸馏中 Teacher 的类间相似度来自软输出，过度平滑训练出的 Teacher 可能丢失有用的相对 logit 结构。

有标签噪声时，平滑可降低单个硬标签的支配；但它不区分可信与可疑样本，也可能削弱稀有类监督。类别不平衡任务可把 u 设为先验分布，但要防止进一步偏向多数类。

## 工程实践

确认框架 `label_smoothing` 的分配定义、`ignore_index` 和 reduction 口径。固定其他正则化，扫描 $$\varepsilon$$ 与学习率，按类别和置信度分桶看准确率、NLL、Brier Score、ECE。用于生成模型时只对有效 label token 计算，避免把 padding 或被 mask 的提示位置纳入平滑。

## 常见追问

1. **$$\varepsilon$$ 等于 0 时是什么？** 目标退化为原始 one-hot，损失就是普通交叉熵。
2. **Label Smoothing 等同于降低 Softmax 温度吗？** 不等同。前者修改训练目标分布；温度缩放修改 logits，常在训练后用于校准或在采样时控制分布。
3. **为什么可能伤害知识蒸馏？** Teacher 被训练得不再表达清晰的错误类别相对关系，Student 从软标签中获得的“暗知识”可能减少。
4. **类别不平衡时能直接用均匀平滑吗？** 可以作为基线，但可能不符合真实先验；应与 class weight、重采样及类别先验平滑做分桶比较。

## 一句话复习

> Label Smoothing 用软目标抑制极端自信，可能换来泛化，也可能牺牲校准与类间软信息。

## 参考资料

- [Rethinking the Inception Architecture for Computer Vision](https://arxiv.org/abs/1512.00567)
- [When Does Label Smoothing Help?](https://arxiv.org/abs/1906.02629)
