---
title: '为了提高 Prompt Cache 命中率，Prompt 模板应该怎样组织？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Prompt Cache'
  - '前缀'
  - '成本优化'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明稳定内容前置、动态内容后置以及字节级变化对命中的影响，同时提醒隔离和失效。

**可以这样答：**

> 把长期不变的系统说明、工具定义和共享示例放在前缀，把用户问题、时间和请求级变量放在后面。避免在稳定前缀中插入随机 ID、当前时间或无意义的字段顺序变化，因为许多缓存按前缀 Token 精确匹配。模板和工具版本变化时要让缓存自然失效，不能复用语义已不同的旧前缀。涉及租户私有信息时还要按权限和缓存键隔离，不能为了命中率跨边界共享。

## 常见追问

1. **把所有示例都放前缀一定划算吗？** 不一定，示例越多预填充成本越高，应比较复用次数、缓存价格和质量收益。
2. **为什么字段顺序会影响缓存？** 即使语义相同，序列化后的 Token 序列不同也会导致精确前缀无法复用。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
