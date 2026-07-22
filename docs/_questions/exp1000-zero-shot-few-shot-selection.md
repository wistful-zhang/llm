---
title: '一个新任务该用 Zero-shot 还是 Few-shot，怎么判断？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: 'Prompt 与上下文工程'
difficulty: '简单'
study_tier: 'extended'
tags:
  - 'Zero-shot'
  - 'Few-shot'
  - '评测'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

从任务歧义、格式稳定性、示例成本与模型能力四个维度组织答案。

**可以这样答：**

> 先用 Zero-shot 建立基线，如果任务定义清晰且模型已稳定掌握，就不必增加示例。标签边界模糊、输出格式特殊或需要模仿业务判断时，少量高质量示例通常更有效。示例会占用 Token，并可能带来顺序偏差和过拟合，所以要在代表性验证集上比较收益。若大量示例仍不能稳定工作，问题可能需要检索、工具或微调，而不是继续堆 Prompt。

## 常见追问

1. **Few-shot 示例越接近当前输入越好吗？** 通常相关性有帮助，但也要覆盖边界和反例，避免只展示一个局部模式。
2. **怎样控制示例带来的标签偏置？** 平衡类别、随机化顺序并做多组示例对照，观察预测是否随示例分布明显漂移。

## 延伸阅读

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
