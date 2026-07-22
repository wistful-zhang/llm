---
title: "Beam Search 为什么会有长度偏置，Length Penalty 如何处理？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "工程实践"
difficulty: "中等"
study_tier: "role"
tags:
  - Beam Search
  - 长度偏置
  - 解码
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

不要只说“长序列概率更小”，要把原因说完整：Beam Search 累加每步 log probability，而这些值通常为负，生成越长累计分数越低，EOS 较早的候选因此占优。随后给出长度归一化或 length penalty 的作用，并说明系数过大又会偏爱冗长输出。被问调参时，应看任务质量和长度分布，不是盯一个平均长度。

**可以这样答：**

> Beam Search 用累计 log probability 比较候选，每生成一个 Token 通常都会加上负数，因此长序列天然积累更多惩罚，较早生成 EOS 的短候选更容易胜出。Length normalization 或 length penalty 会按长度重新缩放分数，缓解这种偏置，但系数过大又可能鼓励啰嗦和重复。它是解码偏好校正，不会改变模型本身的条件概率。

## 核心回答

Beam Search 同时保留若干累计分数最高的生成前缀，扩大了相对贪心解码的搜索范围。但序列分数通常是各 Token 对数概率之和，而对数概率大多不大于零，序列越长累计分数往往越低，原始分数会偏向过早输出 EOS 的短句。Length Penalty 或长度归一化用长度函数调整累计分数，缓解短句偏置；它改变的是搜索时的排序目标，并没有修复模型本身的概率校准。

## 展开说明

常见形式可写成：

$$
\operatorname{score}(y)=\frac{\log P(y\mid x)}{\operatorname{lp}(|y|)}
$$

其中 $$\operatorname{lp}$$ 可以是长度的幂或随长度平滑增长的函数。惩罚太弱仍偏短，过强则可能偏向冗长或重复。Beam 宽度增加只让搜索更充分；若模型给 EOS 的概率或目标函数本身有偏差，更宽的 Beam 反而可能更稳定地找到错误的短序列，这就是“搜索更强不等于任务质量更高”。

候选何时可以安全停止也与归一化有关：不能看到第一个完成序列就一定停止，要比较它与未完成前缀可能达到的最佳分数上界。不同库对 `length_penalty` 的公式、是否包含 EOS、早停条件和分数返回方式并不完全一致，参数值不可直接跨实现照搬。

## 工程实践

在翻译、摘要等目标相对确定的任务上，用同一模型比较 Greedy、不同 Beam 宽度和长度惩罚，报告任务指标、输出长度分布、截断/空输出率、重复率、延迟和 KV Cache。按输入长度切片检查最优参数是否漂移，并保存实际生成配置。开放式对话若需要多样性，Beam 往往不是默认选择；结构化输出则应优先配合约束解码和业务校验。

## 常见追问

1. **Beam 越宽，结果一定越好吗？** 不一定。它更准确地优化模型给定的序列分数，但该分数可能与真实任务质量不一致，还会增加计算和缓存。
2. **直接除以序列长度就足够吗？** 不一定，简单平均可能反过来偏向长句；长度函数和系数需要按模型、任务与实现验证。
3. **Length Penalty 会改变模型概率吗？** 不会，它只在搜索中重排候选，得到的是启发式解码分数，不能再解释为原模型的规范化概率。

## 一句话复习

> Beam Search 的对数概率累加天然偏短；长度惩罚重排候选来折中长度，但更宽搜索和更高分都不保证任务质量更好。

## 参考资料

- 面试主题：[LLMs Interview Questions](https://github.com/Devinterview-io/llms-interview-questions)
- 技术依据：[Breaking the Beam Search Curse](https://arxiv.org/abs/1808.10006)
