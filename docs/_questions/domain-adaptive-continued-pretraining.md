---
title: "领域继续预训练与 SFT 应该如何选择和衔接？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "训练与对齐"
difficulty: "中等"
study_tier: "role"
tags:
  - Continued Pretraining
  - DAPT
  - SFT
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

依据“缺知识还是缺行为”区分：模型对领域术语和语料分布本身陌生，考虑领域继续预训练；模型知道知识但不会按业务指令或格式回答，用 SFT。常见顺序是 DAPT 后 SFT，但要提醒 DAPT 成本高且可能遗忘。追问如何判断时，可先看领域 PPL、闭卷知识和业务任务表现。

**可以这样答：**

> 领域继续预训练使用领域原始语料继续做语言建模，主要让模型适应术语、知识和分布；SFT 使用指令—回答数据，主要塑造任务行为和输出格式。模型不懂领域内容时先考虑 DAPT，已经具备知识但不会按要求回答时优先 SFT，复杂项目可先 DAPT 再 SFT。DAPT 成本更高，也要用通用回归集检查灾难性遗忘。

## 核心回答

领域继续预训练（DAPT）通常在大量无标注领域文本上继续优化语言模型目标，让模型适应术语、文体与知识分布；SFT 在输入—回答或多轮指令样本上训练，主要塑造任务行为和输出格式。只有原始文档、领域分布差异大时先做 DAPT；已有高质量任务示范、目标是遵循指令时优先 SFT；两者都需要时常采用 `Base → DAPT → SFT → 偏好对齐`。

DAPT 与 SFT 都可能使用 next-token loss，但数据构造和被优化的 token 不同，因此效果不能互相替代。DAPT 不会自动教会聊天格式，SFT 规模太小也不适合承担大范围知识吸收。

## 展开说明

《Don't Stop Pretraining》区分 Domain-Adaptive Pretraining 和 Task-Adaptive Pretraining：前者使用某领域的大语料，后者使用目标任务相关但仍无标注的文本。对现代 Decoder-only 模型，可继续使用因果 LM 目标；随后 SFT 用 Chat Template、样本边界和回答 Loss Mask 学习交互行为。

继续预训练会改变原模型分布。只用狭窄语料、学习率过高或训练过久，可能损伤通用能力；常见缓解方式是混入适量通用重放数据、减小学习率、监控通用回归并早停。扩充 Tokenizer 只有在领域文本分词极差且收益足够大时才值得，因为它会改 Embedding/LM Head，并增加部署兼容成本。

## 工程实践

先用 Base Model 测领域困惑度、术语 token 长度和真实任务基线，再决定是否需要 DAPT。DAPT 与 SFT 分别保存数据版本、Optimizer/Schedule 和独立检查点；新阶段通常重新建立优化器状态并 Warmup，但这属于需验证的配置，不是唯一做法。每阶段同时评估领域、通用、安全和格式遵循，才能定位收益来自哪里。

## 常见追问

1. **DAPT 与 SFT 的数学目标完全不同吗？** 不一定，Decoder-only 场景都可基于交叉熵；关键差异在数据分布、序列结构和哪些 token 计入损失。
2. **有领域文档为什么不直接做 RAG？** RAG 适合可更新、需引用的显式知识；DAPT 更适合术语、文体和隐式分布适配，二者也可组合。
3. **继续预训练一定要修改 Tokenizer 吗？** 不需要。多数项目先复用原 Tokenizer；只有严重分词低效且收益经评估后才考虑扩词表。

## 一句话复习

> DAPT 用无标注领域文本改变模型分布，SFT 用示范数据塑造任务行为；常见衔接是先适应领域，再学习如何回答。

## 参考资料

- [Don't Stop Pretraining: Adapt Language Models to Domains and Tasks](https://arxiv.org/abs/2004.10964)
