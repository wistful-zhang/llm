---
title: 'LLM 事件流里的 Prompt、工具和评测事件，Schema 怎样向后兼容？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Schema 演进'
  - '事件流'
  - '兼容性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明新增可选字段、语义版本、消费者容错和回放测试，不能静默改字段含义。

**可以这样答：**

> 事件携带 schema 版本与稳定事件类型，新增字段默认可选并给明确缺省语义，消费者忽略未知字段。字段含义或单位变化不能沿用旧名，应发布新字段或主版本并提供双写迁移期。原始事件不可就地改写，派生消费者通过升级函数读取历史版本。上线前用真实历史事件回放新消费者，验证不会因缺字段、乱序或重复事件失败。

## 常见追问

1. **删除没人用的字段可以吗？** 先通过消费者注册和观测确认无依赖，经历弃用期后再停止写入，历史读取仍要支持。
2. **JSON 没有强 schema 怎么办？** 仍可用 JSON Schema 或类型定义做契约校验，格式灵活不代表语义无需治理。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
