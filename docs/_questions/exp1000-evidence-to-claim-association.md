---
title: 'Prompt 中放了多段证据，怎样让模型明确每个结论来自哪一段？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '证据引用'
  - '可追溯'
  - 'Grounding'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

建议为片段分配稳定 ID，要求逐项引用，并在生成后校验引用存在和蕴含关系。

**可以这样答：**

> 给每段证据分配稳定且无业务歧义的 ID，并保留来源、时间等元数据。要求回答中的事实性结论附对应证据 ID，证据不足时明确写无法确认，而不是补全常识。生成后先检查引用 ID 是否存在，再用规则或模型判断证据是否真的支持该结论。最终展示可以把 ID 转为用户可访问的链接或文档位置，但不能让模型自行编造地址。

## 常见追问

1. **一句话需要多个引用怎么办？** 可以附多个证据 ID，但应确保每个引用都贡献支持，避免堆砌无关来源。
2. **引用存在就代表答案可信了吗？** 不代表，还要检查证据质量、时效性以及是否被模型错误解释。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
