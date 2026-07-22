---
title: 'Browser Agent 操作网页时，应该优先使用 DOM 还是截图视觉定位？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Agent'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Browser Agent'
  - 'DOM'
  - '视觉定位'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

比较 DOM 的结构稳定与视觉对 Canvas、远程桌面的覆盖，提出双通道交叉验证。

**可以这样答：**

> DOM 提供元素角色、文本和可访问名称，通常比像素坐标稳定，也便于确认输入框和按钮语义。截图视觉适合 Canvas、图片控件和无可访问树的界面，但容易受缩放、滚动和遮挡影响。实践中先用 DOM 定位，必要时用视觉补充，并在点击前检查元素可见、可交互和所在页面。高风险提交前读取页面最终状态并让用户确认，不能只凭旧截图坐标点击。

## 常见追问

1. **Shadow DOM 怎么处理？** 使用支持穿透或显式访问 Shadow Root 的浏览器接口，无法访问时再采用视觉方案。
2. **按钮文本重复怎么办？** 结合父区域、角色、可访问名称和稳定属性定位，避免只按文本取第一个。

## 延伸阅读

- [ReAct](https://arxiv.org/abs/2210.03629)
