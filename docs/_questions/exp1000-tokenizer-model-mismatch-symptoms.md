---
title: '模型与 Tokenizer 错配时会出现哪些典型现象？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '简单'
tags:
  - 'Tokenizer'
  - '模型加载'
  - '调试'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从 ID 语义错位、特殊 Token 配置和可运行但乱码三个层面回答。

**可以这样答：**

> 词表大小相同也可能 ID 到字符串映射不同，模型收到的向量语义就会整体错位，输出常表现为乱码、重复或完全不相关。BOS、EOS、PAD 和 Chat Template 错配还会造成不停止、提前停止或角色混乱。排查应核对 Tokenizer 文件哈希、特殊 ID，并用官方固定文本比对编码结果和首步 Logit。

## 常见追问

1. **词表大小不同为什么有时仍能加载？** 框架可能自动 Resize 或忽略不匹配行，但这不代表新增或缺失 Token 语义正确。
2. **只看 decode(encode(text)) 能发现所有错配吗？** 不能，Tokenizer 自身可逆仍可能与模型权重不匹配。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
