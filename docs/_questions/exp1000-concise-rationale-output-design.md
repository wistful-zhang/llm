---
title: '既想让答案可解释，又不想输出冗长推理，Prompt 怎么设计？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '简单'
tags:
  - '可解释性'
  - '输出设计'
  - '依据'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

建议输出结论、关键依据、假设和不确定性四个可验收部分。

**可以这样答：**

> 可以要求模型先给结论，再列出少量决定性依据、使用的假设和仍需核实的信息。依据应引用输入事实或外部证据，而不是泛泛描述“经过分析”。对计算任务保留关键公式和中间结果，对决策任务给出影响选择的主要权衡。这样既便于用户检查，也能控制长度和敏感信息暴露。

## 常见追问

1. **关键依据写几条合适？** 通常两到四条足够，具体由任务复杂度决定，重点是每条都能被验证。
2. **模型会不会编造依据？** 会，因此要要求引用输入位置或工具结果，并由程序检查引用是否真实存在。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
