---
title: "In-Context Learning 与参数微调有什么本质区别？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "LLM 基础"
difficulty: "简单"
tags:
  - In-Context Learning
  - 微调
  - Few-shot
published: true
verified: true
date: 2026-07-14
---

## 核心回答

In-Context Learning（ICL）把指令和示例放进当前 Prompt，模型权重不更新，行为只在这次上下文中改变；参数微调则用训练数据反向传播更新全部或部分权重，使行为持久写入新检查点。ICL 上手快、便于按请求切换任务，但占上下文、增加 Prefill 延迟且受示例顺序影响；微调前期成本更高，却能减少长 Prompt、稳定特定格式并处理大量领域样本。

## 展开说明

GPT-3 展示了零样本、一样本和少样本上下文学习能力，但 ICL 并不等于模型现场真正执行梯度下降。微调包括全参数、LoRA 等参数高效方法，都会产生需要版本化和评测的新参数状态。RAG 提供外部事实、ICL 示范任务行为、微调改变模型策略，三者可组合而不是互斥替代。

## 工程实践

需求早期先用清晰指令和少量示例建立 ICL 基线，统计质量、Prompt Token、TTFT 和单次成本；当示例集稳定、调用量大或上下文预算紧张时，再比较微调。无论哪种方案都要固定模板、Tokenizer 和模型版本；ICL 示例属于不可信输入时，还要隔离数据与指令，防止示例中的注入覆盖系统规则。

## 常见追问

1. **ICL 会永久学会用户给的样例吗？** 单次推理不会更新权重，样例离开上下文后不再生效；服务是否另行记录数据属于独立的数据治理问题。
2. **微调能替代 RAG 注入最新知识吗？** 通常不能完全替代；频繁变化、需引用来源的事实更适合外部检索，微调更适合行为和格式。
3. **什么时候优先 LoRA？** 基座可用、任务稳定且需要持久适配，同时显存和存储受限时可优先验证 LoRA，但仍需与 Prompt 基线比较。

## 一句话复习

> ICL 用当前上下文临时示范、零参数更新；微调用训练把行为持久写入参数，取舍在灵活性、上下文成本和维护成本。

## 参考资料

- 面试主题：[LLM Interview Questions](https://github.com/llmgenai/LLMInterviewQuestions)
- 技术依据：[Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165)
