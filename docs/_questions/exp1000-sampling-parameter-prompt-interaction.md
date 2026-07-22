---
title: 'Prompt 写得很严格，为什么高 Temperature 下仍可能不稳定？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '简单'
tags:
  - 'Temperature'
  - '采样'
  - '稳定性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

解释 Prompt 改变分布而采样从分布取值，两者不能互相替代。

**可以这样答：**

> Prompt 只能影响下一个 Token 的概率分布，Temperature 等采样参数决定如何从这个分布中选择。高 Temperature 会放大小概率候选的机会，因此即使规则明确，边界格式和措辞也更容易漂移。结构化、可执行任务通常使用较低随机性并增加校验，创意任务才适合保留更多多样性。参数调整仍要在真实样本上测试，因为过低随机性也可能固化某类错误。

## 常见追问

1. **Temperature 为零能修复错误 Prompt 吗？** 不能，它只减少采样变化，任务边界或上下文本身错误仍会稳定地产生错误答案。
2. **Top-p 和 Temperature 应同时调吗？** 可以，但同时改变不利于定位影响，通常先固定一个再评估另一个。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
