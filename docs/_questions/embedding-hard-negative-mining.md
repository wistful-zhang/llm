---
title: "训练 Embedding 时如何选择 Hard Negative 而不引入假负例？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "NLP 与机器学习"
difficulty: "困难"
study_tier: "role"
tags:
  - Hard Negative
  - Embedding
  - 对比学习
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

Hard Negative 的标准不是“分数越高越好”，而是模型容易混淆、业务上又确定不相关。说明可从 BM25 或旧双塔召回候选，再用规则、交叉编码器或人工排除潜在正例。训练最好从半难样本逐步加难并定期刷新。被问风险时，重点是假负例会把真实相似项强行推远。

**可以这样答：**

> Hard Negative 应当是当前模型容易误认为相关、但业务标签明确不相关的样本。常见做法是用 BM25 或上一版双塔召回高分候选，再借助交叉编码器、规则和人工抽查排除潜在正例。训练可从半难负例开始，随模型能力提升刷新索引。只追求最难样本会提高假负例率，标签不完整时尤其容易损害表示空间。

## 核心回答

随机负例容易到模型几乎不用学习就能分开，Hard Negative 则与查询很像但不相关，能提供更有信息的梯度。可用 BM25、当前双塔或较强 Cross-Encoder 从未标正的候选中挖掘，再混入一定比例随机和半难负例。最大风险是“未标注不等于不相关”：假负例会把真正相关项推远，因此要做规则过滤、教师打分、多正例建模或降低可疑负例权重。

## 展开说明

批内负例便宜，但同批可能有同义查询或多答案；模型挖掘的最难候选还可能集中在标注缺口和噪声上。ANCE 通过异步更新文档索引进行全局负例挖掘，扩大了候选空间，同时引入索引滞后。合理课程可先用较容易负例获得稳定表示，再逐步提高难度，而不是一开始只喂排名最靠前的负例。

## 工程实践

保存每轮挖掘模型、索引和过滤规则的版本；抽样人工核验 top hard negatives 的假负率。对同文档段落、同产品别名、同一问多种答案做去重或多正例处理。离线除 Recall@k 外还要看困难切片、长尾查询和向量塌缩，上线用真实点击时需校正曝光偏差。

## 常见追问

1. **为什么不能只用最难负例？** 最难项中标签噪声和真相关项比例高，训练也可能被少数极端样本主导而不稳定。
2. **In-batch Negative 的前提是什么？** 默认同批其他正例对当前查询不相关；多意图、多答案数据往往不满足，需要 Mask 或多正例损失。
3. **Cross-Encoder 教师一定可靠吗？** 不一定，它也有域偏差；应以校准阈值、人工抽检和下游检索结果共同约束。

## 一句话复习

> Hard Negative 提供有效梯度，也最容易藏假负例；用多来源难度混合、过滤和人工抽检控制风险。

## 参考资料

- 面试主题：[Machine Learning System Design Questions](https://github.com/alirezadir/machine-learning-interviews/blob/main/src/MLSD/ml-system-design.md)
- 技术依据：[Dense Passage Retrieval](https://arxiv.org/abs/2004.04906)、[ANCE](https://arxiv.org/abs/2007.00808)
