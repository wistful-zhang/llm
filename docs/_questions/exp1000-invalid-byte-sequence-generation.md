---
title: 'Byte-Level 模型生成了非法 UTF-8 序列时，服务端应该怎样处理？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
tags:
  - 'Byte Token'
  - 'UTF-8'
  - '流式生成'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 Token 边界不等于字符边界，流式端要缓冲不完整字节并定义错误策略。

**可以这样答：**

> 一个 Unicode 字符的多个 Byte 可能由连续 Token 生成，中途流式解码时序列暂时不完整是正常的。服务端应使用增量 UTF-8 Decoder 缓冲尾部 Byte，等形成完整字符后再下发。若最终仍非法，要采用明确的替换、拒绝或原始 Byte 策略，并避免错误恢复造成安全过滤与实际显示不一致。

## 常见追问

1. **每个 Token 解码后立刻发送有什么风险？** 可能产生乱码、替换字符，甚至让前后端看到不同文本边界。
2. **为什么安全过滤要在同一解码语义上执行？** 若过滤器和客户端对非法 Byte 的恢复不同，攻击内容可能在一端被隐藏、另一端可见。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
