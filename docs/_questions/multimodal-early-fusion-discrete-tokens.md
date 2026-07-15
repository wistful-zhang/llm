---
title: "Chameleon 式离散早融合如何把图像与文本统一成 Token 序列？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
verified: true
review_status: "待复习"
category: "多模态"
difficulty: "困难"
tags:
  - Early Fusion
  - Discrete Image Token
  - Multimodal Generation
published: true
answer_status: complete
date: 2026-07-14
---

## 面试时怎么答

离散早融合先说明图像经过 Tokenizer 变成码本索引，再与文本和模态边界 Token 组成统一序列做下一 Token 预测。优势是理解与生成接口统一，代价是图像量化损失、序列过长和模态竞争；别把它与连续视觉特征加 Cross-Attention 混为一谈。

**可以这样答：**

> 离散早融合先用图像 Tokenizer 把图片压成码本索引，再与文本 Token 和模态边界放进同一序列，由一个自回归模型统一理解和生成。它的优势是接口统一、可自然生成图文交错内容；代价是离散化会丢细节，视觉 Token 很长，还可能与文本能力争夺模型容量。

## 核心回答

以 Chameleon 为代表的一类离散早融合模型，把不同模态尽早表示成同一种离散序列。文本由 Tokenizer 变成文本 Token；图像先经离散图像 Tokenizer 编码成 Codebook ID，再映射到图像 Token。模型把二者放进统一词表或可区分的 Token 空间，用一个自回归 Transformer 按顺序预测下一个 Token，因此同一模型既能接收图文交错输入，也能生成文本或图像 Token。早融合还存在连续特征等其他设计，本题只讨论这种离散自回归路线。

与“视觉编码器产生连续 Patch 特征，再通过 Projector 接入 LLM”的路线相比，离散早融合更对称，天然支持图像作为输出；代价是图像 Tokenizer 的重建误差、很长的视觉序列、多模态数据配比和跨模态优化不稳定。统一目标不代表每种模态的处理完全相同，图像仍需要专用编码/解码器把像素与离散 Code 互转。

## 展开说明

训练序列可形如“文本 Token—图像开始标记—图像 Code—图像结束标记—文本 Token”。因果 Mask 让模型学习任意前缀下的后续分布；通过改变数据排列，可以覆盖图像描述、文本到图像和图文续写。Chameleon 展示了 Mixed-Modal Early-Fusion 的代表性设计。

离散图像 Code 的数量由图像 Tokenizer 的下采样率和 Codebook 决定。Token 太少会损失细节，太多会显著增加上下文、注意力计算和生成延迟。Codebook 使用不均、图像与文本 Loss 数量级不同，也会造成一种模态主导训练。

早融合不保证跨模态 Grounding 自动出现。模型仍需要高质量交错数据、配对数据和任务评测；生成像素逼真也不等于遵循文本，回答正确也不等于图像重建良好。

## 工程实践

分别记录图像 Tokenizer 的重建质量、Codebook 使用率、每模态 token 占比和 Loss，再测图像生成、图像理解与交错生成。设置图像尺寸和视觉 token 上限，避免少量高分辨率样本吞噬 Batch。数据管线显式加入模态边界，验证截断不会留下半张图的 Code。服务端把文本安全过滤与生成图像内容审核分开，不能只检查文本 Prompt。

## 常见追问

1. **离散图像 Token 与 ViT Patch Token 一样吗？** 不一样。前者通常是可生成的 Codebook ID，后者多为连续视觉特征。
2. **统一词表后还需要图像解码器吗？** 需要。Transformer 生成的是离散 Code，仍要由图像 Tokenizer 的解码器还原为像素。
3. **为什么视觉序列通常很长？** 图像包含大量空间信息，较细的离散网格需要许多 Code，直接增加上下文和生成步数。
4. **统一下一 Token 目标是否足够？** 它提供统一训练接口，但最终能力仍取决于 Tokenizer、数据覆盖、模态平衡和评测。

## 一句话复习

> 早融合模型把文本与离散图像 Code 混成一个自回归序列，用统一预测目标换取任意模态输入输出，同时承担图像量化与长序列成本。

## 参考资料

- [Chameleon: Mixed-Modal Early-Fusion Foundation Models](https://arxiv.org/abs/2405.09818)
