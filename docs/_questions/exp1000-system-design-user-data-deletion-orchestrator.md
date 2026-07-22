---
title: '请设计一个用户数据删除 Orchestrator，覆盖 LLM 应用的所有派生数据。'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '数据删除'
  - 'Orchestrator'
  - '数据血缘'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

回答资产清单、幂等子任务、tombstone、对账和备份恢复，强调可证明完成。

**可以这样答：**

> 先建立从主体到会话、文件、向量、摘要、缓存、反馈和微调数据的数据血缘清单。删除请求写入全局 tombstone 并生成各存储的幂等子任务，在线查询先阻断，再异步清理物理副本。Orchestrator 跟踪每项状态、重试和人工异常，最终用清单对账生成不含原文的完成证明。备份按保留期过期，任何恢复流程先应用 tombstone，避免已删数据复活。

## 常见追问

1. **日志里的 request_id 也必须删除吗？** 按法规与目的判断，可保留不可回溯个人的审计信息，身份映射和敏感载荷应删除或去标识。
2. **第三方模型供应商怎么办？** 通过合同和 API 触发其删除流程，记录确认状态，并限制无法满足要求的供应商使用场景。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
