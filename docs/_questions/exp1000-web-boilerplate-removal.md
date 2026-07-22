---
title: '网页 Boilerplate Removal 为什么会误删正文，怎样评估？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '预训练与数据'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Boilerplate'
  - '网页清洗'
  - '正文抽取'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明 DOM 密度规则对论坛、文档站和短页面并不通用，并用成对页面审计。

**可以这样答：**

> 正文抽取器常依据链接密度、文本长度和 DOM 位置删除导航、广告与页脚，但论坛回复、API 目录和短定义页可能正好像模板。误删会让内容残缺，漏删则让全站菜单高频重复。应按站点类型建立黄金页面，比较正文召回、模板残留和段落顺序，并保留原 DOM 供规则迭代。

## 常见追问

1. **只保留 article 标签够吗？** 不够，许多站点不用语义标签，或把关键内容放在其他容器。
2. **模板重复能交给后续去重吗？** 部分可以，但片段级模板混在不同正文中，文档级去重往往抓不全。

## 延伸阅读

- [Hugging Face Datasets 文档](https://huggingface.co/docs/datasets/)
