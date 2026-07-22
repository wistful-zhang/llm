---
title: '怎样用 Prompt 把一个复杂问题拆成可执行的子问题？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '中等'
tags:
  - '任务分解'
  - '规划'
  - 'Prompt'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

讲清拆分标准、依赖关系、停止条件和结果汇总，避免把“让模型一步步想”当成完整方案。

**可以这样答：**

> 可以要求模型输出目标、已知条件、待求信息、子任务依赖和每一步需要的工具或证据。子问题应尽量独立且可验证，存在依赖时要标出执行顺序，而不是生成一串宽泛标题。执行过程中根据真实结果更新计划，对已失败或无价值的分支停止扩展。最终汇总必须回到原问题，并检查每个结论能否追溯到子任务结果。

## 常见追问

1. **拆得越细越好吗？** 不是，过细会增加调用次数和误差传播，应拆到每一步能够独立获取或验证信息即可。
2. **如何避免错误计划一路执行？** 在关键节点加入结果校验和重规划条件，让执行器根据观察而非初始假设继续。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
