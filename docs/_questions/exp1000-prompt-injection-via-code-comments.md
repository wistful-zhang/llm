---
title: '让模型审查代码时，代码注释里的恶意指令应该怎样处理？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '困难'
tags:
  - '代码审查'
  - 'Prompt Injection'
  - '工具安全'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把代码和注释都视作被分析数据，说明工具权限、输出约束与可疑内容检测。

**可以这样答：**

> 整个仓库内容包括注释、README 和测试数据都应视为不可信输入，只能作为审查对象。系统指令要明确模型不能因仓库文本修改任务或调用权限，但真正的限制仍由工具沙箱和允许路径实现。涉及执行测试或命令时使用预定义命令、资源限制和人工确认，不能直接运行代码中建议的任意脚本。输出还要检查是否包含密钥、内部提示或由仓库诱导生成的外部请求。

## 常见追问

1. **删除所有可疑注释再审查可行吗？** 可能破坏语义且容易漏掉其他载体，更稳妥的是隔离输入并限制可执行能力。
2. **只读代码工具是否就没有风险？** 风险较低但仍可能泄露源码或诱导输出敏感信息，网络访问和日志权限仍需控制。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
