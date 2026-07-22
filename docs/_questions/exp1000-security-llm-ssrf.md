---
title: '带网络工具的 LLM 应怎样防御 SSRF？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '评测与安全'
difficulty: '困难'
tags:
  - 'SSRF'
  - '网络安全'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

建议按“结论—例子—边界”回答“LLM 工具 SSRF”：核心判断要明确，验证要可复现，并说明只校验原始字符串不足，代理层和实际连接目标都要执行策略。

**可以这样答：**

> 这件事可以概括为：解析并规范化目标 URL，只允许批准域名和协议，阻断内网、元数据地址、重定向跳转与 DNS 重绑定。落到实验或实现上，测试多种 IP 表示、重定向链和解析后地址变化。同时要确认，只校验原始字符串不足，代理层和实际连接目标都要执行策略。

## 常见追问

1. **“LLM 工具 SSRF”最需要讲清的核心内容是什么？** 解析并规范化目标 URL，只允许批准域名和协议，阻断内网、元数据地址、重定向跳转与 DNS 重绑定
2. **哪项具体检查可以支撑你对“LLM 工具 SSRF”的判断？** 测试多种 IP 表示、重定向链和解析后地址变化
3. **“LLM 工具 SSRF”最容易被忽略的前提是什么？** 只校验原始字符串不足，代理层和实际连接目标都要执行策略

## 延伸阅读

- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
