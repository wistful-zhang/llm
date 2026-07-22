---
title: '新模型上线前怎样做 Shadow Traffic，又不产生双重副作用和隐私问题？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Shadow Traffic'
  - '模型发布'
  - '隐私'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明复制经授权输入、禁用真实工具与输出、采样限额和成对评测。

**可以这样答：**

> 主请求正常服务，经过授权与脱敏的采样副本异步发送到候选模型，影子输出绝不返回用户。工具全部替换为只读模拟或录制结果，不能让候选轨迹产生付款、邮件等副作用。系统关联同一评测 ID，比较质量、延迟、拒答和成本，同时限制采样率与保留期。包含不能跨供应商或区域的数据直接排除，不能为评测突破原有用途限制。

## 常见追问

1. **Shadow 结果延迟很高有影响吗？** 不影响主请求，但仍要按候选生产目标测量，积压过多时限流或丢弃低优先样本。
2. **如何比较开放式答案？** 结合成对模型评审、规则和盲人工抽样，并先校准评审偏差。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
