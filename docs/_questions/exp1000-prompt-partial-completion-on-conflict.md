---
title: '用户请求中只有一部分违反规则时，模型应该全部拒绝还是部分完成？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '部分完成'
  - '安全边界'
  - '用户体验'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

强调可分离性：拒绝危险部分，清楚说明边界，并继续完成独立安全部分。

**可以这样答：**

> 如果安全部分与违规部分可以独立完成，应只拒绝有风险的部分，并继续提供合规帮助。回答要清楚指出没有执行什么、为什么受限，以及可行的安全替代，避免让用户误以为整个任务已完成。若安全部分会实质帮助完成被禁止目标，就不能通过拆分变相提供。Prompt 应给出这种决策原则，最终边界仍由策略系统评估。

## 常见追问

1. **怎样判断安全部分会不会促进危险目标？** 看它对完成目标的必要性和可操作性，不能只看单句表面是否无害。
2. **部分完成会不会让输出很啰嗦？** 可以用简短边界说明加可用结果，不必重复完整政策文本。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
