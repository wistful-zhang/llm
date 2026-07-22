---
title: '请设计一个能理解大型代码仓库的 Coding Assistant。'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '系统设计'
difficulty: '困难'
study_tier: 'extended'
tags:
  - '代码助手'
  - '代码索引'
  - 'Sandbox'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

覆盖版本化代码索引、上下文选择、隔离执行和 Patch 验证，不要只说接一个代码模型。

**可以这样答：**

> 仓库服务按提交构建符号、AST、文本和依赖索引，查询时绑定用户有权访问的具体分支与 commit。上下文生成器结合符号引用、调用图和语义检索选择代码，避免混用不同版本。修改由模型生成 Patch，在受限工作树中应用，再运行允许的格式化、测试和静态检查。任何推送或创建 PR 都由用户确认，代码、注释和测试内容按不可信输入处理。

## 常见追问

1. **索引落后于最新提交怎么办？** 请求携带 commit，索引未就绪时增量解析相关文件或明确提示，而不是回退旧版本静默回答。
2. **超大仓库怎样控制上下文？** 先按目录与符号缩小候选，再沿依赖图扩展必要邻居，并保留可回查引用。

## 延伸阅读

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
