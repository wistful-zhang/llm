---
title: '怎样设计多家模型供应商的 Adapter，避免被最低公分母限制？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '困难'
tags:
  - '供应商抽象'
  - 'Adapter'
  - '能力协商'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

建议稳定核心协议加能力扩展，不要强行把所有特性伪装成一致。

**可以这样答：**

> 定义消息、流式文本、用量、取消和统一错误等稳定核心接口，模型特有能力通过显式 capability 声明。调用方请求结构化输出、视觉或工具时先检查目标能力，不能静默降级成普通文本。Adapter 负责协议转换和错误标准化，但保留供应商请求 ID 与原始可审计元数据。契约测试覆盖每个供应商版本，能力变化触发评测而不是无感切换。

## 常见追问

1. **参数 temperature 能统一吗？** 名字相同也可能语义和范围不同，应定义支持矩阵并避免假精确映射。
2. **模型自动回退会改变答案怎么办？** 返回实际模型标识，按任务限定可回退集合，高风险任务可选择失败而非换模型。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
