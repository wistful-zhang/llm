---
title: '更换底层模型时，原来的 Prompt 为什么不能直接照搬？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - '模型迁移'
  - '兼容性'
  - '回归'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明模型在指令遵循、格式、工具和安全边界上的差异，并给出迁移验证流程。

**可以这样答：**

> 不同模型的指令遵循方式、Tokenizer、上下文利用、结构化输出和工具调用能力都可能不同。同一段措辞在新模型上可能变得冗余、冲突或触发不同拒答行为。迁移时先固定业务评测集建立新基线，再逐项调整模板、采样参数和工具 schema，并做影子流量比较。Prompt 版本必须与模型版本绑定，确认质量、延迟、成本和安全指标后再切换。

## 常见追问

1. **新模型更强，能不能先删掉所有 Few-shot？** 可以作为候选实验，但要用分类边界和格式样本验证，不能凭参数规模判断。
2. **迁移时最容易漏测什么？** 拒答边界、长上下文位置、非主流语言以及工具参数细节经常被忽略。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
