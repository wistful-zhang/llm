---
title: '多租户 LLM 平台怎样把模型、检索和工具成本准确归因到租户与功能？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '成本归因'
  - '计量'
  - '多租户'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明统一 usage event、价格版本、共享成本分摊和对账，不只统计模型 Token。

**可以这样答：**

> 每个请求和子调用携带租户、功能、项目与 trace_id，模型侧记录输入输出和缓存 Token，检索、重排、GPU 时长及外部工具也产生统一 usage event。事件绑定当时价格版本，异步聚合支持重放和去重。共享 GPU 与平台固定成本按可解释规则分摊，同时保留直接成本与分摊成本两个视图。账单与供应商记录周期性对账，差异超过阈值进入调查。

## 常见追问

1. **缓存命中怎么计费？** 按真实供应商和平台成本记录，再由产品定价策略决定向客户如何收费，两者不要混为一谈。
2. **失败请求也计成本吗？** 成本事实仍要记录，是否收费由业务规则决定，并区分用户错误和平台故障。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
