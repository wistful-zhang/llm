---
title: '用户输入有错别字、口语和无关内容时，Prompt 应该怎样保持任务稳定？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '噪声输入'
  - '鲁棒性'
  - '意图理解'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明规范化、保留原文、置信边界和不能擅自改动关键实体。

**可以这样答：**

> 可以先做轻量规范化和意图抽取，但要保留原文供追溯，尤其不能静默修改姓名、编号和金额。Prompt 要允许忽略与任务无关的寒暄或粘贴噪声，并要求列出影响理解的不确定项。对常见错别字可结合词典纠正，低置信的实体则向用户确认。测试集应包含口语、混合语言、重复句和截断输入，避免只在干净样本上优化。

## 常见追问

1. **能否让模型自动纠正所有错别字？** 不应对关键字段无条件纠正，可生成候选并让规则或用户确认。
2. **无关内容怎么判定？** 依据当前任务和字段契约判断，无法确认时保留或询问，不能凭关键词粗暴删除。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
