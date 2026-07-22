---
title: '用户文本里出现 system 或 assistant 标记时，Tokenizer 层怎样防止角色伪造？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '评测与安全'
difficulty: '困难'
tags:
  - 'Role Token'
  - 'Prompt Injection'
  - 'Tokenizer'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明用户内容要作为数据编码，只有模板渲染器能插入真实控制 ID。

**可以这样答：**

> 角色标记应由受信任模板代码直接插入特殊 Token ID，用户文本则走禁止 Special Token 的普通编码路径。若输入包含相同可见字符串，应转义或编码为普通子词，而不是解析成控制边界。服务端还要保存结构化消息，不应把拼接后的文本再次经过会识别特殊标记的二次解析。

## 常见追问

1. **只在前端过滤标记够吗？** 不够，攻击者可绕过前端，权限边界必须在服务端编码器和模板层。
2. **普通 Token 能拼出类似标记怎么办？** 可见相似不等于真实特殊 ID，但模型仍可能被语义诱导，需要上层指令与安全策略配合。

## 延伸阅读

- [HELM](https://arxiv.org/abs/2211.09110)
