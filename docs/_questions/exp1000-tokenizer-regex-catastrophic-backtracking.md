---
title: 'Tokenizer 的正则 Pre-Tokenizer 为什么可能成为性能或安全问题？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '困难'
tags:
  - 'Regex'
  - 'Tokenizer'
  - '性能安全'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明灾难性回溯、超长输入和不同正则引擎语义，给出线性时间防护。

**可以这样答：**

> 复杂回溯正则在特制长字符串上可能出现指数级匹配时间，使 Tokenization 成为 CPU 拒绝服务入口。不同语言和正则引擎对 Unicode、环视和转义的支持也可能让训练与部署切分不一致。应使用可证明线性或受限的模式、设置输入上限，并对重复字符、超长数字和混合 Unicode 做压力测试。

## 常见追问

1. **把 Tokenizer 放到 GPU 就能解决吗？** 不能解决规则本身的最坏复杂度，而且多数文本规范化仍在 CPU 完成。
2. **怎样发现线上退化？** 监控每字符编码耗时、P99、输入类型和队列长度，而不只看平均 Token/s。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
