---
title: '流式输入时为什么不能对每个文本 Chunk 独立 Tokenize 后直接拼接？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Streaming Input'
  - 'Tokenizer'
  - '边界'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 Tokenization 依赖跨 Chunk 的字符上下文，独立编码会改变 Merge 和空格边界。

**可以这样答：**

> 子词 Merge 可能跨过任意网络 Chunk 边界，一个单词被拆成两段后分别编码，结果通常不同于完整文本一次编码。Unicode 多 Byte 字符和组合字符也可能刚好被切开。流式编码器需要保留足够尾部状态、只提交已经不可能再合并的 Token，或在输入完成后统一 Tokenize。

## 常见追问

1. **保留最后一个字符就够吗？** 不一定，最长可合并片段可能包含多个字符，边界状态由具体 Tokenizer 决定。
2. **语音转写流式输入也有这个问题吗？** 有，转写文本自身还可能回改早先片段，需要支持重编码和缓存失效。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
