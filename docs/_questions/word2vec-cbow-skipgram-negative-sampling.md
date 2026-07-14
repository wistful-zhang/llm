---
title: "CBOW、Skip-gram 与 Negative Sampling 有什么区别？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "NLP 与机器学习"
difficulty: "简单"
tags:
  - Word2Vec
  - CBOW
  - Negative Sampling
published: true
verified: true
date: 2026-07-14
---

## 核心回答

CBOW 用窗口内上下文词的表示预测中心词，训练快、对高频模式较平滑；Skip-gram 用中心词预测周围词，产生更多训练对，通常更擅长学习低频词但成本更高。标准 Softmax 每次要遍历整个词表，Negative Sampling 把问题改成“真实词对为正、从噪声分布采样的词对为负”的若干二分类任务，从而显著减少计算。

## 展开说明

Skip-gram 的一个窗口会形成多个 `(center, context)` 正样本；负采样分别提高正样本点积、降低负样本点积。原论文常按词频的 `3/4` 次幂采负例，在高频词与长尾词之间折中。训练得到输入、输出两套向量，实际使用可取输入向量或组合，选择应由下游验证决定。

## 工程实践

窗口大小决定偏向句法还是主题语义，低频词阈值和高频词下采样会明显影响结果。负例数不是越多越好，要与语料规模和算力权衡。静态词向量适合轻量基线与可解释相似度，但面对一词多义、上下文推断和领域新词时通常不如上下文编码器。

## 常见追问

1. **Negative Sampling 是在近似 Softmax 概率吗？** 它训练的是噪声对比式二分类目标，并非直接计算标准 Softmax 的无偏近似。
2. **窗口越大表示越好吗？** 不一定；大窗口更偏主题相关，小窗口更偏局部句法，且会引入更多弱相关词对。
3. **为什么高频词要下采样？** 冠词、介词等产生大量低信息训练对，下采样可节省计算并改善较有内容词的表示。

## 一句话复习

> CBOW 以上下文猜中心词，Skip-gram 以中心词猜上下文；负采样用少量真假词对二分类替代全词表计算。

## 参考资料

- 面试主题：[LLMs Interview Questions](https://github.com/Devinterview-io/llms-interview-questions)
- 技术依据：[Efficient Estimation of Word Representations](https://arxiv.org/abs/1301.3781)、[Distributed Representations of Words and Phrases](https://arxiv.org/abs/1310.4546)
