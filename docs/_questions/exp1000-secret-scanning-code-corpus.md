---
title: '代码预训练语料中的 Secret Scanning 为什么不能只靠正则？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Secret Scanning'
  - '代码语料'
  - '安全'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明密钥格式多样、熵特征、上下文验证和历史版本泄漏。

**可以这样答：**

> 正则适合识别已知 Token 前缀和固定格式，但自定义密钥、连接串和私钥片段可能没有稳定模式。应组合高熵检测、文件路径与变量名上下文、校验和或提供方验证，并扫描 Git 历史而非只看最新分支。检测结果本身高度敏感，必须隔离处理，不能把疑似 Secret 写进普通日志。

## 常见追问

1. **高熵字符串都会是 Secret 吗？** 不会，哈希、压缩数据和测试样例也高熵，需要上下文和格式降低误报。
2. **已经失效的密钥能保留训练吗？** 仍可能泄露组织信息和教会模型复现模式，通常应删除。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
