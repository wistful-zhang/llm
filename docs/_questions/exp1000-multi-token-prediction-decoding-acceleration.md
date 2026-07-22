---
title: '多 Token 预测头怎样加速解码，它和小模型 Draft 有什么区别？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '困难'
study_tier: 'extended'
tags:
  - 'Multi-token'
  - 'Medusa'
  - '解码'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

说明在目标模型隐藏状态上并行提出未来 Token，再由目标分布验证。

**可以这样答：**

> 多 Token 预测方法在同一目标模型上增加若干轻量头，从当前隐藏状态并行提出后续多个 Token 或候选树。主模型随后一次验证候选，减少串行解码步数。它不需要加载完整独立 Draft Model，但附加头需要训练，候选质量仍决定接受长度。性能取决于树宽、验证 kernel 和批调度，候选过多会增加无效计算。

## 常见追问

1. **为什么不能直接接受所有预测头输出？** 附加头只是近似未来分布，必须由主模型验证才能保持目标模型输出分布。
2. **它会改变模型质量吗？** 正确验证算法理论上保持目标分布，实现近似或错误剪枝则可能引入偏差。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
