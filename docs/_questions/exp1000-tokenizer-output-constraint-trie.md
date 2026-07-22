---
title: '基于 Token Trie 做受约束生成时，Tokenizer 的前导空格为什么容易造成 Bug？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
tags:
  - 'Constraint Decoding'
  - 'Token Trie'
  - 'Tokenizer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明候选字符串在不同上下文边界可能对应不同首 Token，不能离线只编码一次。

**可以这样答：**

> 许多词表把前导空格与单词绑定，候选值在句首和已有文本后可能产生不同 Token 序列。若 Trie 只用独立编码结果，合法候选可能被拒绝，或非法边界被允许。构建约束时要把当前字符前缀、已生成 Token 和 Tokenizer 的边界语义一起考虑，必要时允许多个等价 Tokenization。

## 常见追问

1. **为什么直接限制字符更难？** 模型每步输出 Token，一个 Token 可能含多个字符，也可能与已有字符前缀重叠。
2. **JSON 约束会遇到类似问题吗？** 会，空白、转义和多字符 Token 都要求状态机在 Token 级验证所有字符转移。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
