---
title: '加载 LLM 权重时，哪些架构配置不一致会导致“能运行但结果错误”？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '中等'
tags:
  - '模型配置'
  - '权重加载'
  - '调试'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

列出 RoPE、Norm、Head 布局、激活和词表绑定等不会总触发形状报错的配置。

**可以这样答：**

> RoPE Base、旋转配对、Norm Epsilon、激活函数和 Attention Scale 改错时，张量形状可能完全匹配却得到错误 Logit。GQA 的 Head 重排、是否使用 Bias、Embedding 缩放和共享权重配置也可能静默改变语义。加载后应使用官方小样例比对逐层输出或固定 Prompt Logit，而不能把“没有 Missing Key”当成正确。

## 常见追问

1. **为什么只比较生成文本不够？** 采样和浮点差异会放大，逐层或前几个 Token 的 Logit 更容易定位最早偏差。
2. **Tokenizer 配置算架构配置吗？** 严格说属于输入输出协议，但错配同样会让权重正常加载而语义完全错误。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
