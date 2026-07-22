---
title: 'Prompt 模板里的动态变量应该怎样定义和校验？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '模板变量'
  - 'Schema'
  - '输入校验'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把变量视为接口契约，说明类型、长度、缺省值、编码和敏感级别。

**可以这样答：**

> 每个变量都应有明确类型、是否必填、最大长度、允许值和缺失时的行为，不能用任意字符串占位。渲染前按 schema 校验，并将不可信内容放进独立数据区，避免它改变模板结构。变量还应标注敏感级别，决定能否记录日志或用于缓存。模板升级若改变变量含义，需要新版本和兼容策略，不能静默复用旧调用方。

## 常见追问

1. **变量为空时直接填空字符串可以吗？** 只有语义明确时可以，否则应使用缺失标记或阻止调用，避免模型误解。
2. **模板引擎转义后就不会注入了吗？** 转义能保护模板语法，但自然语言中的指令注入仍需上下文隔离和权限控制。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
