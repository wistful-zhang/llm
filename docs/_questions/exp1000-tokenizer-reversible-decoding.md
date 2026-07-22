---
title: 'Tokenizer 的 Encode 和 Decode 为什么不总能严格还原原始文本？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Tokenizer'
  - '可逆性'
  - 'Normalization'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

指出归一化、空白清洗、未知 Token 和非法 Byte 都可能让映射有损。

**可以这样答：**

> 若编码前做 NFKC、大小写折叠或空白清洗，不同原文会先变成同一标准形式，Decode 无法知道原始写法。UNK 也会把多个片段压成同一 ID，Byte 序列不完整时还可能被替换字符解码。需要精确保真的系统应保存原文或字符到 Token 的偏移映射，不能假定 Decode 是通用序列化格式。

## 常见追问

1. **Byte-Level Tokenizer 就一定完全可逆吗？** 基础表示可逆，但若前置 Normalizer 改写文本或后处理跳过 Token，仍会有损。
2. **为什么偏移映射也可能难做？** 归一化会合并或展开码点，一个标准化字符未必对应原文单一位置。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
