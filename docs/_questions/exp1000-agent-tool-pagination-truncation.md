---
title: '工具结果有分页或被截断时，Agent 怎样避免把“不完整”当成“没有”？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Agent'
difficulty: '中等'
study_tier: 'extended'
tags:
  - '分页'
  - '截断'
  - '工具协议'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

要求返回明确的 has_more、游标和截断原因，并让 Agent按任务决定继续。

**可以这样答：**

> 工具响应应包含 items、next_cursor、has_more 和是否因大小限制截断，空列表与未取完必须可区分。Agent 根据用户目标决定是否继续翻页，并设置总条数、时间和费用上限。涉及“全部”“最大”或合规审计时，未遍历完成不能下结论。每页结果按稳定排序和快照版本读取，避免数据变化导致重复或漏项。

## 常见追问

1. **为什么不用页码？** 游标对动态数据通常更稳定，页码在插入删除后容易漂移。
2. **工具直接返回摘要可以吗？** 可以，但要标明覆盖范围和截断，关键任务仍需访问原始项。

## 延伸阅读

- [ReAct](https://arxiv.org/abs/2210.03629)
