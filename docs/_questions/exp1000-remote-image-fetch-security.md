---
title: '允许用户给图片 URL 时，后端抓取链路要防哪些安全问题？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '多模态'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'SSRF'
  - '图片抓取'
  - '文件安全'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

覆盖 SSRF、重定向、大小与解压限制、类型嗅探和隔离解码。

**可以这样答：**

> 抓取服务必须阻止内网、环回、云元数据和非允许协议，DNS 解析后与每次重定向后都重新检查目标地址。设置连接、下载大小、像素总量和解码时间限制，防止慢请求与解压炸弹。不要相信文件扩展名或 Content-Type，要验证魔数并在隔离进程中解码。抓取器不携带用户 Cookie 或内部凭据，生成的安全副本再交给模型。

## 常见追问

1. **只允许 HTTPS 就能防 SSRF 吗？** 不能，内网服务也可用 HTTPS，仍要校验解析 IP 和重定向目标。
2. **为什么限制像素总量？** 压缩文件可能很小但解码后占用巨大内存，造成资源耗尽。

## 延伸阅读

- [CLIP](https://arxiv.org/abs/2103.00020)
