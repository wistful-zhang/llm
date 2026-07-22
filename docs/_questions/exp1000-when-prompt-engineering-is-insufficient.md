---
title: '遇到效果问题时，怎么判断继续改 Prompt 已经不划算？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '方案选型'
  - 'Prompt'
  - '微调'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

按知识缺失、工具需求、稳定格式和行为学习分类，给出转向 RAG、代码或微调的信号。

**可以这样答：**

> 如果错误来自缺少最新或私有知识，应优先考虑检索；需要精确计算或外部动作时应接工具。若多轮 Prompt 调整只能在样本间来回波动，且任务有大量稳定示例，才考虑微调或专用分类器。输出格式问题先用结构化解码和校验解决，不能靠无限堆示例。决策应比较端到端质量、维护成本、延迟和数据要求，而不是把 Prompt 当成免费方案。

## 常见追问

1. **多少条样本才值得微调？** 没有固定门槛，取决于任务一致性和基线差距，应先用小规模高质量数据做学习曲线实验。
2. **Prompt 和微调可以一起用吗？** 可以，微调学习稳定行为，Prompt 仍负责当前任务、动态约束和上下文。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
