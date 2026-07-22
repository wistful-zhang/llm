---
title: '模型、Prompt、RAG 和工具都在变化时，Feature Flag 应该怎样设计？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '困难'
tags:
  - 'Feature Flag'
  - '实验'
  - '配置'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把一次请求解析成不可变配置快照，支持按租户灰度和紧急 Kill Switch。

**可以这样答：**

> Flag 服务根据用户、租户、地区和实验桶解析模型、Prompt、检索和工具策略，生成请求级不可变配置快照。整个请求和异步续跑都使用同一快照，避免执行中途规则改变。高风险功能有独立 Kill Switch，可立即阻止新动作，并定义在途任务如何处理。每种组合不能无限增长，发布流程绑定兼容矩阵和评测证据，日志记录解析后的实际配置。

## 常见追问

1. **为什么不每一步重新读 Flag？** 会让同一任务前后使用不一致策略，难以复现并可能越过确认边界。
2. **Kill Switch 关闭后在途工具怎么办？** 按风险定义取消、完成或人工接管，副作用工具不能只依赖新请求阻断。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
