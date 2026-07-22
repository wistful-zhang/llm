---
title: 'PEFT Adapter 保存与加载时为什么必须记录 Base Model？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '编程与框架'
difficulty: '中等'
tags:
  - 'PEFT'
  - 'Adapter'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

组织答案时围绕“Adapter 工件契约”展开：把定义或机制讲清楚，用具体例子验证，并说明能加载不代表语义兼容，合并权重后也要重新评测。

**可以这样答：**

> Adapter 只含增量参数和配置，必须与正确的基础模型 revision、Tokenizer 和 target modules 配套。例如，故意加载到错误 revision，检查缺键与输出漂移。需要注意的是，能加载不代表语义兼容，合并权重后也要重新评测。

## 常见追问

1. **不铺背景，直接说明“Adapter 工件契约”的核心机制或判断。** Adapter 只含增量参数和配置，必须与正确的基础模型 revision、Tokenizer 和 target modules 配套
2. **把“Adapter 工件契约”落到一个可检查的例子，你会怎么做？** 故意加载到错误 revision，检查缺键与输出漂移
3. **什么情况下不能直接套用“Adapter 工件契约”？** 能加载不代表语义兼容，合并权重后也要重新评测

## 延伸阅读

- [Hugging Face Transformers 文档](https://huggingface.co/docs/transformers/)
