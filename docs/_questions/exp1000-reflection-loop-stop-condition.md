---
title: '设计多轮反思 Prompt 时，怎样设置停止条件？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - '反思循环'
  - '停止条件'
  - '成本控制'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从硬上限、可验证通过条件和边际收益三个角度回答。

**可以这样答：**

> 反思循环至少要有最大轮数和 Token 或时间预算，防止模型无休止改写。若任务有 schema、测试或证据覆盖要求，应在全部通过后立即停止。开放任务可以比较前后评分和修改幅度，当连续一轮没有解决新问题时结束。超过预算仍不合格，应返回当前最佳结果并标记风险，或转人工处理。

## 常见追问

1. **让模型自己说“已经完成”可靠吗？** 不能单独依赖，应由外部验证器或明确指标决定，模型声明只作为信号。
2. **固定两轮反思是否合理？** 可作为简单基线，但更好的方法是一次生成后按失败类型有针对性地修复。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
