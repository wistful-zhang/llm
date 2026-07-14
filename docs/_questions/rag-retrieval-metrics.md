---
title: "如何用 Recall@K、MRR 和 nDCG 评估 RAG 检索？"
source: "Datawhale 公开真实面试题整理；答案依据检索基准论文原创整理"
review_status: "待复习"
category: "RAG"
difficulty: "中等"
tags:
  - Recall@K
  - MRR
  - nDCG
published: true
verified: true
date: 2026-07-13
---

## 核心回答

先为每个问题建立相关文档或证据标注，再根据目标选指标。Recall@K 衡量 Top-K 覆盖了多少相关证据，适合检查第一阶段是否漏召回；MRR 只关注第一个相关结果出现得多早；nDCG@K 同时考虑排序位置和分级相关性。检索指标只能说明证据是否被找到，不能替代答案正确性和忠实度评估。

## 展开说明

设一个问题共有 R 个已标注相关文档，Top-K 找到其中 r 个：

- **Recall@K = r / R**：强调覆盖率。若每题只标一个标准证据，它会退化为是否命中的 0/1 指标。
- **Precision@K = r / K**：反映候选中的噪声比例，但当相关文档很少时会受 K 影响较大。
- **Hit@K**：Top-K 中至少有一个相关结果就记为 1，不应与一般定义的 Recall@K 混用。
- **MRR**：对每题第一个相关结果排名的倒数取平均，适合只需要一个正确入口的场景。
- **nDCG@K**：对不同相关等级赋予增益并按位置折损，再用理想排序归一化，适合“核心证据、辅助证据、无关”这类分级标注。

Chunk 级标注、文档级标注和“包含答案字符串”并不等价，应事先定义什么算相关。

## 工程实践

离线集要覆盖真实查询分布和难例，并保存 Query、相关 Chunk、标注理由与数据版本。按问题类型、租户、语言和文档来源切片，不只看总平均分。检索达标后，再固定检索结果评估生成器的答案正确性、上下文利用率和 Faithfulness；自动评审指标需要用人工样本校准。

## 常见追问

1. Recall@K 与 Hit@K 为什么容易被混淆？
2. 只有一个相关文档时，MRR 和 Recall@K 各关注什么？
3. 检索指标很好但答案仍差，应怎样定位？

## 一句话复习

> Recall 看覆盖，MRR 看首个命中，nDCG 看分级相关性与位置；它们都不是最终答案质量。

## 参考资料

- 面经主题：[Datawhale 真实面试题中的 RAG 分阶段评估](https://github.com/datawhalechina/hello-agents/blob/main/Extra-Chapter/Extra01-%E9%9D%A2%E8%AF%95%E9%97%AE%E9%A2%98%E6%80%BB%E7%BB%93.md)
- 技术依据：[BEIR](https://arxiv.org/abs/2104.08663)、[RAGAS](https://arxiv.org/abs/2309.15217)
