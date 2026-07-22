---
title: '信息不足时，模型应该直接拒答还是向用户追问？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - '澄清问题'
  - '拒答'
  - '交互设计'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

按缺失信息是否可补、风险高低和交互成本选择，不要把所有不确定都做成拒答。

**可以这样答：**

> 如果缺失信息能够由用户提供且会显著改变结果，应提出一到三个最关键的澄清问题。若请求本身不允许、证据不可获得或风险过高，则应明确拒答并说明可提供的安全替代。低风险场景可以在标明假设后继续，避免无休止追问。Prompt 应定义这些分支，应用也要支持多轮状态，保证用户回答能正确回到原任务。

## 常见追问

1. **一次追问多少个问题合适？** 只问足以推进任务的少量问题，通常一到三个，按信息价值排序。
2. **用户不回答澄清问题怎么办？** 给出基于明确假设的有限结果，或说明无法安全继续，而不是自行填造关键事实。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
