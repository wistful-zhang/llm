---
title: '大模型服务的 Admission Control 为什么要按 Token 预算而不是只按请求数？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '中等'
tags:
  - '准入控制'
  - 'Token 预算'
  - '过载'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明请求长度差异巨大，并将 Prefill、最大 KV 和输出预测纳入准入。

**可以这样答：**

> 一个短问答和一个十万 Token Prompt 的资源需求相差巨大，只限制并发请求数无法保护 GPU。准入时估算输入 Prefill 成本、最大 KV 占用和预计输出长度，为在途请求预留 Token 容量。超出安全水位时排队、拒绝或降低最大输出，而不是接受后再 OOM。估计值与实际用量持续对账，并给超长或低优先任务独立队列。

## 常见追问

1. **用户把 max_tokens 设很大怎么办？** 按产品上限截断并结合历史预测预留，但必须保留最坏情况安全边界。
2. **Prompt Cache 命中是否减少准入预算？** 减少 Prefill 计算，但该请求的 KV 生命周期和输出预算仍需计入。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
