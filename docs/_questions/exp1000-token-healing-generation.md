---
title: 'Token Healing 解决了续写 Prompt 末尾的什么问题？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Token Healing'
  - 'Tokenizer'
  - '生成'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 Prompt 末尾可能截在词中，已有切分会限制下一 Token 的自然续写。

**可以这样答：**

> 用户 Prompt 末尾若是一个单词的前半部分，独立编码时可能形成只适合词尾的 Token，直接续写会得到不自然分支。Token Healing 会回退最后一个或几个 Token，约束模型重新生成与原字符前缀一致的更完整 Tokenization。它改善边界续写，但需要高效枚举合法 Token 前缀，并避免改写用户已确认的内容。

## 常见追问

1. **为什么字符前缀与 Token 前缀不同？** 多个词表 Token 可能共享同一字符开头，原先的贪心切分不一定适合后续文本。
2. **Chat 模型每次都需要 Healing 吗？** 通常只在自由补全文本且末尾可能截词时有价值，完整消息边界不一定需要。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
