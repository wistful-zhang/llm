---
title: 'YaRN 扩展 RoPE 上下文时主要在平衡什么？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: 'LLM 基础'
difficulty: '困难'
tags:
  - 'YaRN'
  - 'RoPE'
  - '长上下文'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

讲清不同频段的插值策略和注意力温度修正，不必堆论文术语。

**可以这样答：**

> YaRN 不对所有 RoPE 频率一刀切，而是在需要插值和可以外推的频段之间平滑过渡。它尽量保留高频的局部位置分辨率，同时让低频覆盖更长距离。方法还会调整注意力尺度，以补偿上下文变长后分布变化，因此不是单纯修改一个 RoPE Base。

## 常见追问

1. **YaRN 后短上下文一定无损吗？** 不一定，频率和温度都改变了，必须同时测短任务与长任务。
2. **如何验证扩展真的有效？** 除 Needle 测试外，还要测多跳、长文理解和不同位置上的任务表现。

## 延伸阅读

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
