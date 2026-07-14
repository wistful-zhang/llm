---
title: "Chain-of-Thought 与 Self-Consistency 为什么能改善复杂推理？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "LLM 基础"
difficulty: "中等"
tags:
  - Chain-of-Thought
  - Self-Consistency
  - 推理
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论：** Chain-of-Thought 通过生成中间推理步骤分解难题，Self-Consistency 再对多条采样路径的最终答案投票。
2. **再讲关键机制：** 说明示例或提示如何诱导步骤化推理，以及温度采样、答案规范化和多数聚合。
3. **主动说取舍：** 它常提升复杂推理，但增加 token 与时延，公开推理文本也不等于忠实解释。
4. **最后落到项目：** 在数学题集比较准确率、采样数、单题 token、P95 时延和一致性；到这里停。

**60 秒口述示例：**

> 我会先分两层讲：CoT 让模型把复杂问题拆成中间步骤；Self-Consistency 不只走一条贪心路径，而是采样多条推理链，对规范化后的最终答案投票，从而降低偶然错误。它的成本近似随采样数增长，而且推理链未必忠实。项目里我会画准确率随样本数的收益曲线，并报告单题 token、P95 时延和答案一致率。


## 核心回答

Chain-of-Thought（CoT）提示模型在最终答案前生成中间步骤，为算术、常识和符号推理提供更多计算 Token，并把复杂映射拆成较小步骤。Self-Consistency 不只走一条贪心路径，而是采样多条不同推理轨迹，再按最终答案的一致性聚合，以降低单条路径偶然出错的影响。它提升的是某些任务上的经验表现，不保证中间文字真实、忠实或逻辑正确。

## 展开说明

经典 CoT 在足够大的语言模型上通过少样本推理示例激发分步解题；Self-Consistency 用有随机性的解码获取多条路径，边缘化不同推理过程后选择最一致答案。若多条路径共享同一错误先验，投票仍会一致地错；开放式答案还需要规范化、验证器或语义聚类，不能直接比较原始字符串。

## 工程实践

先比较直接回答、简短理由和 CoT 的准确率、延迟与 Token 成本。可验证任务优先让外部计算器、代码执行器或规则检查最终结果；Self-Consistency 的样本数、温度和聚合器都要固定。面向用户不必暴露冗长内部推理，可返回简洁依据或可核验步骤，并把隐私和 Prompt 注入内容从日志中隔离。

## 常见追问

1. **Self-Consistency 为什么不能用纯贪心采样多次？** 确定性贪心通常每次得到相同路径，无法探索可供聚合的多种推理方案。
2. **多数票适合所有任务吗？** 不适合；数值和选择题较容易规范化，长文本需可靠的答案抽取或语义聚合。
3. **写得更长就代表推理更好吗？** 不代表；冗长可能累积错误或事后合理化，应以最终正确性和外部验证为准。

## 一句话复习

> CoT 用中间 Token 拆解问题，Self-Consistency 采样多条路径聚合答案；二者增加计算但不自动保证推理忠实。

## 参考资料

- 面试主题：[LLM Interview Questions](https://github.com/llmgenai/LLMInterviewQuestions)
- 技术依据：[Chain-of-Thought Prompting](https://arxiv.org/abs/2201.11903)、[Self-Consistency Improves Chain of Thought Reasoning](https://arxiv.org/abs/2203.11171)
