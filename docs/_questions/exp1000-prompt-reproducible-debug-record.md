---
title: '线上 Prompt 出错时，为了复现问题应该记录哪些信息？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - '可复现'
  - '日志'
  - 'PromptOps'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

列出联合版本、实际渲染输入、采样和工具轨迹，同时说明隐私限制。

**可以这样答：**

> 至少要记录请求 ID、模型与 Prompt 版本、采样参数、实际模板变量的脱敏表示、上下文裁剪结果和工具调用轨迹。若服务返回种子、系统指纹或 Token 用量，也应关联保存。不能为复现而无限制记录原始隐私数据，应按字段分级、加密和限期保留，并提供受控重放环境。复现时还要固定依赖版本，因为外部搜索结果和工具状态可能已经变化。

## 常见追问

1. **只记录最终 Prompt 文本够吗？** 不够，模型版本、参数、工具结果和服务端消息包装都会影响输出。
2. **外部工具结果已经变了怎么办？** 在合规前提下保存当时的响应摘要或内容哈希，并用模拟工具重放关键路径。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
