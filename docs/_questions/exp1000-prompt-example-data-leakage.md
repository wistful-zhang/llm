---
title: 'Few-shot 示例里使用真实业务数据会有什么风险？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Few-shot'
  - '数据泄露'
  - '隐私'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从跨请求暴露、日志保留和模型复述风险回答，并给出合成与脱敏替代。

**可以这样答：**

> 真实示例可能包含个人信息、商业秘密或租户数据，并在每次请求中被发送、记录甚至被模型复述。固定模板一旦被多人共用，还可能造成跨用户信息暴露。应使用经过审查的合成样例或不可逆脱敏数据，只保留任务所需结构和难点。示例集要像代码依赖一样做权限、版本和定期清理，不能从线上日志随手复制。

## 常见追问

1. **把姓名替换成张三就够了吗？** 不够，地址、订单、时间组合等准标识符仍可能重新识别个人或客户。
2. **合成示例会不会不真实？** 会，所以应从真实失败模式抽象生成，再由领域人员检查覆盖和合理性。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
