---
title: '训练与验证切换时忘记 model.train() 或 model.eval() 会造成什么现象？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '训练工程'
difficulty: '简单'
study_tier: 'extended'
tags:
  - 'Train Mode'
  - 'Eval Mode'
  - 'Dropout'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

指出 Dropout 和某些状态层行为变化，并说明推理模式不等于关闭梯度。

**可以这样答：**

> Eval 模式通常关闭 Dropout，并让有运行统计的模块使用固定统计；若验证仍在 Train 模式，指标会随机波动且不可复现。训练阶段忘记切回 Train 模式则正则化消失，训练分布与预期不同。model.eval() 只切模块行为，不会自动关闭 Autograd，验证还应使用 no_grad 或 inference_mode 节省显存。

## 常见追问

1. **Transformer 没有 BatchNorm 就无所谓吗？** 仍可能有 Dropout、LayerDrop 或自定义训练态分支。
2. **验证使用 Dropout 能做什么？** 可做 Monte Carlo Dropout 估计不确定性，但那是显式实验，不是默认评测。

## 延伸阅读

- [PyTorch 分布式训练文档](https://docs.pytorch.org/docs/stable/distributed.html)
