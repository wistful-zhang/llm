---
title: '上下文里的两份资料结论矛盾时，应该怎样提示模型回答？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '证据冲突'
  - '可信度'
  - '时效性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

让模型显式呈现冲突，再按来源权威性、时间和适用范围判断，不能简单选最后一段。

**可以这样答：**

> Prompt 应要求模型先识别冲突点，而不是强行合并成一个流畅结论。判断时比较来源权威性、发布时间、版本、适用对象和证据完整度，必要时把两种说法都展示给用户。无法确定优先级时应标记不确定并提出需要补充的信息。程序侧最好预先提供可靠的来源等级和时间字段，避免模型仅凭写作风格判断可信度。

## 常见追问

1. **默认使用最新资料可以吗？** 不能一概而论，最新资料可能是非权威转载，也可能描述不同版本或地区。
2. **模型能自己判断权威来源吗？** 只能作为弱信号，可靠做法是由知识库维护来源白名单和版本元数据。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
