---
title: 'Agent 代表用户访问第三方服务时，OAuth 授权流程该怎么设计？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Agent'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'OAuth'
  - '委托授权'
  - '用户同意'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

覆盖最小 scope、账户绑定、刷新令牌保管和敏感动作的再次确认。

**可以这样答：**

> 用户应在第三方正式授权页完成登录和 consent，Agent 不能代填密码或接触认证凭据。申请最小 scope，并明确展示将访问的账户和能力，读取与写入权限尽量分开。刷新令牌加密保存在凭据服务中，只把短时访问能力交给工具调用。账户切换、scope 提升和高风险动作需要再次确认，用户撤销授权后立即停止并清理缓存。

## 常见追问

1. **一个用户连接多个第三方账号怎么办？** 每次调用绑定明确连接 ID，并在有歧义时让用户选择，不能默认最近账号。
2. **刷新令牌过期如何处理？** 返回可识别的重新授权状态，不要让 Agent 无限重试或请求用户发送令牌。

## 延伸阅读

- [ReAct](https://arxiv.org/abs/2210.03629)
