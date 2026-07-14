---
title: "RAG 如何处理需要多跳证据的问题？"
source: "Datawhale 公开真实面试题整理；答案依据原论文原创整理"
review_status: "待复习"
category: "RAG"
difficulty: "困难"
tags:
  - Multi-hop RAG
  - Query Decomposition
  - Iterative Retrieval
published: true
verified: true
date: 2026-07-13
---

## 核心回答

多跳问题的后续检索词往往依赖前一步发现的实体或事实，一次用原问题检索可能无法找到完整证据。常见做法是先拆分子问题，或在“检索—读取—更新查询”循环中逐步补证据；也可以生成多个查询表达或假设文档改善语义召回。关键是保存每一跳的证据和状态，并设置停止、去重和验证条件，防止错误中间结论继续放大。

## 展开说明

几种策略解决的重点不同：

1. **Query Decomposition**：把可分解问题变成有依赖关系的子问题，按依赖顺序执行。
2. **Multi-Query**：生成多个同义或不同视角的查询，再融合结果，适合原问题表达不足。
3. **HyDE**：先生成假设性文档并编码，用其语义寻找真实文档；假设文本可能包含错误，最终证据仍必须来自语料库。
4. **迭代检索**：像 IRCoT 一样交替推导当前线索和检索下一批证据，适合实体链或组合关系。
5. **自适应检索**：先判断是否需要检索以及何时继续，避免所有问题都固定执行相同跳数。

多次检索会增加延迟、费用和攻击面；跳数越多，也越需要检查证据之间是否真的构成完整推理链。

## 工程实践

状态中记录当前子目标、已确认事实、证据 ID、未解决条件和访问过的查询。设置最大跳数与无新增证据的终止规则，并对查询循环做去重。评估时除最终答案外，还要检查 Supporting Fact Recall、每跳有效命中率、平均跳数和错误传播位置。

## 常见追问

1. Multi-Query 与多跳检索有什么区别？
2. HyDE 生成的假设文档包含错误时为什么仍可能有用？
3. 如何判断迭代检索应该停止？

## 一句话复习

> 多跳 RAG 让新证据驱动下一次检索，但必须控制状态、跳数和中间错误传播。

## 参考资料

- 面经主题：[Datawhale 真实面试题中的多次检索与自适应 RAG](https://github.com/datawhalechina/hello-agents/blob/main/Extra-Chapter/Extra01-%E9%9D%A2%E8%AF%95%E9%97%AE%E9%A2%98%E6%80%BB%E7%BB%93.md)
- 技术依据：[IRCoT](https://arxiv.org/abs/2212.10509)、[HyDE](https://arxiv.org/abs/2212.10496)、[Self-RAG](https://arxiv.org/abs/2310.11511)
