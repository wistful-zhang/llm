---
title: '跨请求复用 KV Cache 时，怎样避免不同用户之间的数据泄露？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'KV Cache'
  - '租户隔离'
  - 'Prefix Cache'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

缓存键必须包含精确 Token、模型与权限域，命中前验证主体和敏感等级。

**可以这样答：**

> 缓存项由模型版本、Tokenizer、精确前缀 Token 和上下文配置共同标识，语义相似不能视为相同。包含用户或租户私有内容的前缀默认只在同一安全域复用，公共模板与私有后缀分开管理。命中与淘汰日志不能暴露原始 Token，并防止通过时间差探测其他用户是否使用过某段内容。权限变化、模板升级和数据删除都要传播到缓存失效。

## 常见追问

1. **缓存只存在 GPU 内存就不敏感吗？** 仍敏感，错误索引或内存复用都可能跨请求泄露，需要逻辑清零与隔离。
2. **前缀哈希相同就能信任吗？** 还要校验模型、位置配置、租户和权限域，哈希本身也应防碰撞。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
