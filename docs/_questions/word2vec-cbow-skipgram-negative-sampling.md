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

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论**：先说 CBOW 用上下文预测中心词，Skip-gram 用中心词预测上下文，后者更照顾低频词。
2. **再讲关键机制**：解释完整词表 Softmax 成本，以及 Negative Sampling 把任务改成真实词对与噪声词二分类。
3. **主动说取舍**：窗口大小改变句法与主题偏好，负例数量和分布影响质量与成本；它不是标准 Softmax 无偏近似。
4. **最后落到项目**：比较类比/相似度、低频词覆盖、训练吞吐、词表内存和下游任务增益。

**60 秒口述示例：**

> 我的结论是 CBOW 把周围词聚合起来预测中心词，训练快且对高频模式稳定；Skip-gram 反过来用中心词预测多个上下文，对低频词通常更友好。完整 Softmax 要遍历大词表，Negative Sampling 改成区分真实词对与采样噪声词的二分类目标，并非直接近似标准 Softmax 概率。项目中我会按语料规模调窗口、负例数和高频词下采样，比较语义相似、低频词效果、训练吞吐和内存。

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
