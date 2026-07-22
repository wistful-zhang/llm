---
title: '同一模型离线评测正常、API 输出异常，怎样排查 Chat Template 不一致？'
source: '扩展知识点整理；尚无逐题真实面经频率证明，答案待逐题资料复核'
verified: false
review_status: '待复习'
category: '推理与部署'
difficulty: '中等'
study_tier: 'extended'
tags:
  - 'Chat Template'
  - 'Special Token'
  - '一致性'
published: true
answer_status: complete
date: 2026-07-22
---

## 面试时怎么答

先固定同一输入并比较最终 Token ID，再逐项核对角色模板、特殊 Token、Generation Prompt 和截断配置。

**可以这样答：**

> 先把离线和 API 两条链路最终送入模型的 Token ID、Attention Mask 与生成参数完整记录下来，而不是只比较可见文本。重点核对 Chat Template 版本、system 角色处理、BOS/EOS、assistant 起始标记和 add_generation_prompt。若序列一致，再检查截断方向、默认停止词与采样参数。修复后用固定对话做 Golden Test，并把模型、Tokenizer 和模板版本作为一个不可拆分的发布单元。

## 常见追问

1. **为什么可见 Prompt 相同，Token ID 仍可能不同？** 模板可能隐式加入角色头、换行和特殊 Token，Tokenizer 的归一化与版本也可能不同。
2. **怎样防止下次升级再次出现？** 把模板文件纳入版本控制，以 Token ID 和期望输出做回归，并在服务启动时校验模型与 Tokenizer 版本组合。

## 延伸阅读

- [NVIDIA TensorRT-LLM 文档](https://docs.nvidia.com/tensorrt-llm/)
