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
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

把 CoT 与 Self-Consistency 分开回答：前者让模型生成中间推理步骤，后者对同一题采样多条路径，再对规范化后的最终答案投票。改善来自路径多样性降低偶然错误，不是“多数推理一定正确”。追问代价时，说明采样成本近似随路径数增长，而且展示的推理链不一定忠实反映内部计算。

**可以这样答：**

> Chain-of-Thought 让模型把复杂问题分解成若干中间步骤；Self-Consistency 不采用一条贪心推理链，而是在较高多样性下采样多条路径，再对最终答案做规范化和投票。多条独立路径可以降低单次采样的偶然错误，但收益依赖路径是否真的多样，计算成本也随样本数增加，而且生成的推理文字不保证忠实解释模型内部原因。

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
