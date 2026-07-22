---
title: '生产环境里的 Prompt 模板应该怎样做版本管理？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - 'PromptOps'
  - '版本管理'
  - '发布'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把 Prompt 当作代码资产来回答：不可变版本、依赖绑定、评测门禁和回滚。

**可以这样答：**

> 每次修改都应生成不可变版本，并记录模板内容、变量 schema、目标模型、参数和评测结果。请求日志保存实际使用的版本号，而不是只保存当前别名，这样才能复现线上输出。发布前运行离线回归和安全测试，再做小流量灰度，关键指标异常时可以一键回滚。模板中的敏感配置和密钥不应进入版本库，环境差异通过受控配置注入。

## 常见追问

1. **只用 Git 管理 Prompt 够吗？** Git 能管理文本变更，但线上还需要版本解析、实验分流、指标关联和权限审计。
2. **模型升级是否要新建 Prompt 版本？** 要，因为同一模板在不同模型上的行为可能变化，应把模型与 Prompt 版本作为联合发布单元。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
