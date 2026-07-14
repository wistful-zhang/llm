---
title: "句向量的 CLS、Mean Pooling 和加权池化如何选择？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "NLP 与机器学习"
difficulty: "中等"
tags:
  - Sentence Embedding
  - Pooling
  - CLS
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论**：先说池化选择必须匹配预训练方式与任务，Mean Pooling 是稳健基线而非绝对最优。
2. **再讲关键机制**：对比 CLS 汇聚位、带 Mask 的均值以及学习权重或多层池化如何形成定长向量。
3. **主动说取舍**：均值可能稀释关键词，CLS 若未被句向量目标训练则表现不稳，加权池化更贵且易过拟合。
4. **最后落到项目**：固定编码器做消融，比较 STS、Recall@K、各向异性、向量时延和存储成本。

**60 秒口述示例：**

> 我会先说没有脱离训练目标的最佳 Pooling。CLS 直接取特殊位置，速度简单，但若模型没用句级目标训练，那里未必天然代表整句；Mean Pooling 汇总所有有效 Token，是常见稳健基线，必须用 Mask 排除 Padding；加权池化容量更强却增加参数和过拟合风险。项目里我会固定同一编码器，在语义相似和检索集上比较 Spearman、Recall@K、向量各向异性、编码延迟和存储，再按结果选。

## 核心回答

CLS Pooling 取特殊位置表示，速度简单，但只有模型训练目标让该位置承载句级语义时才可靠。Mean Pooling 对非 Padding Token 求平均，通常是稳健基线；Max 或注意力加权池化可突出显著特征，却可能过分依赖个别 Token。没有脱离训练目标的最佳池化方式，应与对比学习或下游任务一起训练，并在目标数据上验证。

## 展开说明

基础 BERT 的 `[CLS]` 参与预训练分类目标，但其原始空间不一定适合直接用余弦做语义相似度。Mean Pooling 汇聚所有位置，需用 Attention Mask 排除 Padding；长文本中大量一般性 Token 可能稀释关键信息。加权池化增加可学习参数，如果只有少量监督数据，也更容易过拟合。

## 工程实践

固定编码器、层选择、Pooling、归一化和相似度做完整消融，用检索 Recall@k 或语义相似度而不是只看训练损失。超长文档通常先分块编码再做层次聚合，避免一次 Mean Pooling 抹平主题。导出模型时为全 Padding 或空文本定义明确行为。

## 常见追问

1. **Mean Pooling 为什么必须使用 Mask？** 否则 Padding 的表示也进入平均，且不同批次填充长度会改变同一句子的向量。
2. **取最后一层一定最好吗？** 不一定，不同层包含的信息不同；可验证倒数几层或学习层加权。
3. **池化后是否还要 L2 归一化？** 若用余弦或归一化对比损失通常会做，但点积模型的模长可能有信息，应遵循训练配方。

## 一句话复习

> CLS 依赖句级训练，Mean 是带 Mask 的稳健基线，加权池化更灵活；最终必须连同训练目标和检索指标一起选。

## 参考资料

- 面试主题：[LLMs Interview Questions](https://github.com/Devinterview-io/llms-interview-questions)
- 技术依据：[Sentence-BERT](https://arxiv.org/abs/1908.10084)、[SimCSE](https://arxiv.org/abs/2104.08821)
