---
title: "BPE、WordPiece、Unigram 和 SentencePiece 有什么区别？"
source: "公开面试题整理中的高频分词主题；答案依据原论文与 Hugging Face 官方文档原创整理"
review_status: "待复习"
category: "LLM 基础"
difficulty: "简单"
tags:
  - Tokenizer
  - BPE
  - SentencePiece
published: true
verified: true
date: 2026-07-13
---

## 核心回答

Tokenizer 把文本转换成模型词表中的 token ID。子词方法在“整词词表过大”和“逐字符序列过长”之间折中：常见词可以保留为较长 token，罕见词再拆成较小单元。BPE 从小单元出发，反复合并高频相邻对；WordPiece 也逐步构建子词词表，但合并选择更强调训练语料似然；Unigram 从较大的候选词表出发，逐步删除贡献较小的子词。SentencePiece 是可直接在原始文本上训练和编码的工具框架，可采用 BPE 或 Unigram，并不是与它们并列的单一分词算法。

## 展开说明

词表大小会同时影响表示能力、序列长度和模型参数量。词表太小，文本被切得更碎，注意力计算和生成步数增加；词表太大，Embedding 与输出层更大，低频 token 又可能学不充分。Byte-level BPE 以字节为基础，通常可以避免未知字符，但一个人类可见字符可能对应多个 token。WordPiece 常用 `##` 等约定表示词内续接；SentencePiece 则常把空格编码成普通符号，因此能统一处理是否天然以空格分词的语言。

同一句话在不同模型中 token 数可能差很多，所以“一个 token 等于一个汉字或一个英文单词”并不成立。特殊 token、Unicode 规范化和聊天模板也属于 tokenizer 契约的一部分。

## 工程实践

模型上线前应固定 tokenizer 版本，并测试中文、英文、代码、数字、表情和异常 Unicode 的切分。不能只替换 tokenizer 文件就假设模型仍可工作，因为 token ID 与 Embedding 行一一对应。评估模型成本时也要按真实业务语料统计 token 长度分布，而不是只看字符数。

## 常见追问

1. Byte-level BPE 为什么通常没有 `<unk>`，代价是什么？
2. 词表越大是否一定越好？
3. 为什么同一段中文在不同模型中的 token 数不同？

## 一句话复习

> BPE 从小词表向上合并，Unigram 从大词表向下裁剪；SentencePiece 是可承载这些算法的原始文本分词框架。

## 参考资料

- 面试主题：[Datawhale 的 LLM、VLM 与 Agent 面试问题总结](https://github.com/datawhalechina/hello-agents/blob/main/Extra-Chapter/Extra01-%E9%9D%A2%E8%AF%95%E9%97%AE%E9%A2%98%E6%80%BB%E7%BB%93.md)
- 技术依据：[Hugging Face Tokenization Algorithms](https://huggingface.co/docs/transformers/tokenizer_summary)、[BPE 子词论文](https://aclanthology.org/P16-1162/)、[SentencePiece](https://arxiv.org/abs/1808.06226)
