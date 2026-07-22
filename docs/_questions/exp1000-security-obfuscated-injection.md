---
title: 'Base64、Unicode 与分隔符混淆的注入怎样检测？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '评测与安全'
difficulty: '困难'
tags:
  - 'Prompt Injection'
  - '编码混淆'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

建议按“结论—例子—边界”回答“混淆注入检测”：核心判断要明确，验证要可复现，并说明盲目解码可能制造新语义或误报，检测不能替代权限控制。

**可以这样答：**

> 这件事可以概括为：在安全边界处进行受控规范化和多表示扫描，同时让模型把外部内容视为数据而非指令。落到实验或实现上，生成多层 URL 编码、Unicode 同形和零宽字符变体做回归。同时要确认，盲目解码可能制造新语义或误报，检测不能替代权限控制。

## 常见追问

1. **“混淆注入检测”最需要讲清的核心内容是什么？** 在安全边界处进行受控规范化和多表示扫描，同时让模型把外部内容视为数据而非指令
2. **哪项具体检查可以支撑你对“混淆注入检测”的判断？** 生成多层 URL 编码、Unicode 同形和零宽字符变体做回归
3. **“混淆注入检测”最容易被忽略的前提是什么？** 盲目解码可能制造新语义或误报，检测不能替代权限控制

## 延伸阅读

- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
