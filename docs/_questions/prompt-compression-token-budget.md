---
title: "Prompt Compression 如何减少 Token 又尽量保留指令和证据？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "工程实践"
difficulty: "困难"
tags:
  - Prompt Compression
  - Token 预算
  - LLMLingua
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

先纠正一个常见误区：目标不是把 Prompt 压到最短，而是在固定预算内保住任务所需的信息。回答可以从无损到有损依次讲——去模板与重复、选相关片段、摘要重写、Token 级压缩。

如果对方追问如何防止压掉关键约束，谈实体、数字、指令和证据的保留检查，并为低置信度请求保留原文回退。最后用准确率与成本的 Pareto 曲线收住。

**可以这样答：**

> Prompt Compression 的目标是在上下文预算内保住指令、实体、数字和关键证据，而不是单纯缩短文本。通常先清理模板和重复内容，再按问题选择相关片段，最后才用摘要或 Token 级压缩。压缩越激进，信息失真和额外调用延迟越大，因此要做关键字段校验和原文回退，并联合比较压缩率、答案正确率、引用覆盖、P95 延迟和成本。

## 核心回答

Prompt Compression 的目标是在上下文预算内删减冗余，同时保持任务指令、关键证据、实体、数字和输出约束。方法包括规则去模板、检索后只保留相关片段、抽取式句子选择、生成摘要，以及 LLMLingua 这类用较小语言模型估计信息量并做粗到细 Token 压缩的方法。压缩会改变输入分布且可能删掉决定性否定词，因此必须以端到端任务质量而非压缩率单独验收。

## 展开说明

LLMLingua 先在预算控制下压缩较低信息的段落，再做更细粒度的 Token 级选择，试图保留对目标 LLM 有用的信息。抽取式方法可追溯性好但不够紧凑，生成式摘要更短却可能幻觉或改写事实。Prompt Compression 不等于 Prefix Cache：前者减少模型实际读取的 Token，后者复用相同前缀的计算而不删内容。

## 工程实践

先做确定性清理：去重复、模板和无关历史，再按指令、证据、示例、输出 Schema 分配不可互相挤占的预算。对数字、代码、引用和安全规则设置保护区；按输入长度与任务切片测准确率、引用覆盖、TTFT、成本和压缩失败率。保留原始 Prompt 的受控审计引用，线上能按版本关闭压缩并回退。

## 常见追问

1. **为什么不能只截断最前面或最后面？** 关键指令和证据可能分散在任意位置，固定截断会系统性丢失某一位置的信息。
2. **用强模型总结上下文是否一定划算？** 不一定，总结本身有延迟和费用，还可能幻觉；只有可复用摘要或节省的下游成本足够大时才可能收益。
3. **怎样发现压缩删掉了关键证据？** 做证据句标注或可回答性回归，比较压缩前后引用覆盖，并保留触发低置信度时使用原文的回退路径。

## 一句话复习

> Prompt Compression 用去重、检索、抽取或模型评分换 Token；要保护指令和证据，并以端到端质量与成本共同验收。

## 参考资料

- 面试主题：[AI Engineering Interview Questions](https://github.com/alexeygrigorev/ai-engineering-field-guide/blob/main/interview/questions/06-home-assignments.md)
- 技术依据：[LLMLingua: Compressing Prompts for Accelerated Inference](https://arxiv.org/abs/2310.05736)
