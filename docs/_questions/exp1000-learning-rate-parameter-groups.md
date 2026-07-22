---
title: '新加模块与预训练主干为什么常使用不同 Learning Rate？'
source: '公开岗位面试主题整理；答案为面试口述稿，待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练与对齐'
difficulty: '中等'
tags:
  - 'Parameter Group'
  - '学习率'
  - '微调'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明随机初始化模块需快速学习，主干则要避免大步破坏已有表示。

**可以这样答：**

> 新初始化的 Projector、Head 或 Adapter 没有已有能力，常需要较大学习率快速进入有效尺度。预训练主干已在良好区域，大步更新容易造成灾难性遗忘，因此使用更小 LR 或暂时冻结。参数组还可设置不同 Weight Decay，但要监控梯度和更新比率，防止新模块过强地扰动主干输入。

## 常见追问

1. **先冻结再解冻有什么风险？** 解冻瞬间输入分布和优化器状态变化，需平滑 LR 并观察 Loss Spike。
2. **Layerwise LR Decay 是什么？** 越靠近输入的层使用越小 LR，假设底层通用表示应更少改动。

## 延伸阅读

- [Hugging Face TRL 文档](https://huggingface.co/docs/trl/index)
