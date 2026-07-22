---
title: 'Tokenizer 遇到控制字符和零宽字符时应该怎样处理？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '评测与安全'
difficulty: '困难'
tags:
  - '控制字符'
  - '零宽字符'
  - 'Tokenizer 安全'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明保留有意义字符、规范化危险不可见字符，并保证日志与模型视图一致。

**可以这样答：**

> 换行、制表等控制字符可能有结构意义，不能一律删除；双向控制、零宽字符和不可见分隔符则可能制造视觉欺骗或绕过过滤。输入管线应按白名单和场景规范化，并记录变换后的可见转义形式。最关键的是安全检查、Tokenizer 和最终渲染使用一致文本语义，避免一层删除、另一层仍解释。

## 常见追问

1. **零宽连接符也该删除吗？** 不应一刀切，它参与某些语言和 Emoji 的合法 Grapheme 组合。
2. **为什么日志要转义不可见字符？** 否则排障人员看到的字符串与模型实际接收内容不同，容易漏掉攻击或数据问题。

## 延伸阅读

- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
