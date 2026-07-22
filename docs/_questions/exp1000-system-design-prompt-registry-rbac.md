---
title: '请设计一个 Prompt Registry，怎样支持协作、权限和安全发布？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Prompt Registry'
  - 'RBAC'
  - '发布'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

把模板、变量契约、联合版本和评测证据作为核心实体，说明审核与回滚。

**可以这样答：**

> Registry 保存不可变模板版本、变量 schema、目标模型、工具集和评测报告，环境只引用批准的版本 ID。作者、评审者和发布者权限分离，高风险模板要求安全或领域审批。发布通过灰度别名切换，日志记录实际解析版本，指标异常时原子回滚。密钥和真实用户样本不进入模板仓库，运行时由受控配置注入。

## 常见追问

1. **允许在线直接编辑吗？** 可以创建草稿，但生产别名只能经过评测和审批更新，不能保存即上线。
2. **模板变量变化如何兼容调用方？** schema 破坏变更发布新主版本，并提供迁移期与调用校验。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
