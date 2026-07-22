---
title: 'LLM 应用有 CDN、响应缓存、检索缓存和 KV Cache，怎样统一失效策略？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '缓存'
  - '失效'
  - '版本'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

按各层语义定义键和依赖版本，说明数据、权限与模型变更如何传播。

**可以这样答：**

> 每层缓存的语义不同：CDN 面向公共静态资源，响应缓存绑定完整业务输入，检索缓存绑定索引与权限，KV Cache 绑定精确 Token 前缀。缓存键携带模型、Prompt、数据和策略版本，不能依赖手工清空。知识、权限或删除事件通过失效总线通知相关层，无法精确定位时提升命名空间版本。命中后仍执行必要授权，缓存只优化计算，不绕过安全检查。

## 常见追问

1. **统一设置短 TTL 够吗？** 能降低陈旧窗口但不能满足紧急撤权和删除，也会浪费可长期复用的稳定数据。
2. **版本号一直增长会怎样？** 旧命名空间自然不再命中，后台异步回收，需监控存储避免长期残留。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
