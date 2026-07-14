---
title: "为什么用了 RAG 仍会产生幻觉，如何治理？"
source: "公开真实面经整理；答案依据原论文原创整理"
review_status: "待复习"
category: "RAG"
difficulty: "困难"
tags:
  - Hallucination
  - Faithfulness
  - Grounding
published: true
verified: true
date: 2026-07-13
---

## 核心回答

RAG 只能降低部分事实错误，不能消除幻觉。证据可能没有召回、已过期、相互冲突或夹带噪声；即使上下文正确，生成器也可能忽略证据、错误推理，或把参数知识混入答案。治理要同时覆盖检索质量、上下文选择、基于证据的生成、无证据时拒答，以及逐陈述的引用和支持度评估。

## 展开说明

可以按故障层次归因：

- **Retrieval Miss**：所需证据未进入候选集，优先修复解析、切块、Query 和召回。
- **Ranking / Context Noise**：证据被无关或冲突片段挤出最终上下文，需要过滤、重排、去重和版本控制。
- **Context Misuse**：证据已进入上下文但模型没有正确利用，应检查指令、上下文位置和生成模型能力。
- **Unsupported Generation**：答案包含上下文没有支持的陈述，需要 Claim 级引用、支持度检查和拒答策略。

相似度阈值只能说明检索空间中的接近程度，不能单独证明“有足够证据”。“只根据上下文回答”的 Prompt 也不是安全保证；自动 Faithfulness 或 LLM Judge 是代理指标，应与人工标注校准。

## 工程实践

为答案拆出原子 Claim，检查每个 Claim 是否有明确证据 ID 支持；引用应由实际上下文元数据生成，而不是让模型自由编造链接。建立“无答案、冲突证据、过期文档、恶意文档”测试集，分别跟踪 Context Recall、Context Precision、答案正确率、Faithfulness、拒答精确率和拒答召回率。

## 常见追问

1. Faithfulness 与答案正确性有什么区别？
2. 为什么设置向量相似度阈值不能保证有答案？
3. 如何区分检索失败和生成器没有利用证据？

## 一句话复习

> RAG 的幻觉治理要把“找到证据、选对证据、用好证据、逐条验证”分开处理。

## 参考资料

- 面经主题：[公开 Agent 面经中的 RAG 幻觉问题](https://www.nowcoder.com/discuss/863430474180333568)
- 技术依据：[RAGAS](https://arxiv.org/abs/2309.15217)、[Self-RAG](https://arxiv.org/abs/2310.11511)
