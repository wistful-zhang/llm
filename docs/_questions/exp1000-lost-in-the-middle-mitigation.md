---
title: '长上下文里的 Lost in the Middle 现象是什么，Prompt 侧怎么缓解？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - '长上下文'
  - '注意力'
  - '证据排序'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

先定义现象，再给出位置调整、信息压缩和分阶段处理三类办法，并强调要用任务数据验证。

**可以这样答：**

> Lost in the Middle 指模型对长序列中部信息的利用往往弱于开头和结尾，窗口装得下不代表信息能被同等有效地使用。可以把任务说明放在开头、最终问题和最高价值证据放在靠近结尾的位置，并删除重复或低相关片段。对于大量材料，可先分块抽取事实，再让模型基于较短的证据摘要作答。是否改善要用位置扰动测试和引用命中率评估，不能只凭输出看起来流畅。

## 常见追问

1. **把最重要证据都放最前面可以吗？** 有时有效，但还要考虑模型对最近内容的偏好，实践中常将关键约束置前、关键证据靠近问题。
2. **扩大上下文长度能解决吗？** 只能缓解容量不足，不能保证中间位置的有效利用，甚至会引入更多干扰。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
