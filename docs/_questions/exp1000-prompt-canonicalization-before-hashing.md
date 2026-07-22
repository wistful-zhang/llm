---
title: '对 Prompt 做版本哈希时，为什么需要规范化，哪些内容又不能规范化？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '版本哈希'
  - '规范化'
  - '缓存'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

区分不影响语义的序列化差异与会改变 Token 序列的差异，强调原始版本也要保留。

**可以这样答：**

> 版本系统可以统一换行、字段序列化和无意义元数据，避免同一模板因构建环境不同得到多个标识。不能随意折叠正文空格、重排 Few-shot 示例或改变标点，因为这些操作可能改变 Token 和模型行为。应分别保存源模板哈希、规范化配置哈希和最终渲染内容哈希，服务日志引用实际使用的值。缓存键若依赖精确前缀，还必须基于真正发送给模型的 Token 序列，而不是语义近似文本。

## 常见追问

1. **为什么要同时保存多个哈希？** 它们分别回答源码是否变化、配置是否变化和本次实际请求是否相同，便于审计。
2. **JSON 字段重排一定无影响吗？** 对解析语义可能无影响，但模型读取顺序和前缀缓存都会变化，因此发送内容不能随意重排。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
