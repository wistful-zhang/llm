---
title: 学习分级说明
description: 说明千题题库的学习优先级、证据边界和不同岗位的使用路径。
permalink: /study-tiers/
---

<div class="container prose standalone-page" markdown="1">

# 1000 道题，不等于 1000 道都要背

题库做到 1000 道，是为了覆盖基础原理、应用工程、训练、推理、评测、系统设计和项目表达等不同方向，不代表每道题同等重要，也不代表所有岗位都会问到。对大多数人，更有效的顺序是：**先掌握核心必会，再按目标岗位选择岗位专项，最后把其余题目当作查漏补缺的资料库。**

页面上的“备考层级”只表示建议学习顺序。它不等于题目难度、答案是否经过资料核验、题目是否公开，也不等于你个人的复习状态。这几项会分别显示，不能互相替代。

## 四个层级分别表示什么

| 层级 | 含义 | 建议怎么用 |
| --- | --- | --- |
| **核心必会** | 在常见大模型岗位之间复用度高，能够独立成为主问题，并有公开面经或岗位数据支持的知识点 | 第一次准备时优先完成；至少能先给结论，再讲原理、取舍和一个项目例子，并接住两轮追问 |
| **岗位专项** | 在某类岗位中重要，但并非所有候选人都需要掌握，例如训练算法、推理基础设施、RAG / Agent 应用或多模态方向 | 结合职位描述和自己的项目经历选择，不需要跨方向全部学习 |
| **扩展知识点** | 用于拓宽边界、补充细节或跟进新主题；内容可以练习，但目前没有足够证据把它列为通用默认路径 | 核心和岗位专项完成后再学；也可以在遇到项目问题时按关键词查阅 |
| **待重整** | 题目仍可搜索、阅读和练习，但频率证据、重复性、题目粒度或答案表达仍需要进一步整理 | 不放进默认学习路径；除非与目标岗位或近期面试直接相关，否则可以先跳过 |

“待重整”不是“待审核发布”，也不表示答案一定错误。题目是否发布由公开状态控制，答案是否可用和是否经过资料核验则由答案状态与核验标记控制。

## 分级依据和证据边界

分级不是精确的“出题概率预测”。团队、级别、岗位和时间都会改变面试重点，我们采用的是一套可解释的编辑规则：

1. **跨岗位复用度**：Transformer 基础、RAG、评测、工程取舍和项目深挖等能否在多个常见岗位中复用。
2. **是否能成为主问题**：一个知识点应当能独立展开，而不只是某道题里的一个术语。
3. **是否有重复证据**：优先参考多个相互独立的候选人复盘，或岗位数据与真实复盘的交叉印证。
4. **是否能检验能力**：问题能否让候选人解释原理、边界、方案取舍和真实项目证据，而不仅是背一个定义。

不同资料能证明的事情也不同：

- 候选人复盘可以证明某个时间、岗位或团队问过什么，但属于个人回忆，不能外推为所有公司的统一题库。
- 职位描述统计可以说明市场需要哪些技能，但不能直接证明面试一定会怎样提问。
- 原论文、标准和官方工程文档适合核对答案中的技术事实，不能单独证明某道题“高频”。
- GitHub 面试题合集适合检查覆盖面；收藏量、题目数量或多个合集重复收录，都不能独立证明真实出题频率。

因此，没有可追溯的一手信息时，本站不会把题目包装成某家公司的“原题”。如果新证据出现，或发现重复、过窄和表述不清的题目，层级也会继续调整。

## 我应该从哪里开始

### 第一次准备大模型面试

先只筛选“核心必会”。每题先闭卷口述：用一句话回答结论，再补原理、关键取舍和一个自己真正做过或明确标注为推演的例子。答不出来的题加入薄弱题，第二轮只练这些题，不要一开始顺序刷完 1000 道。

### 已经确定目标岗位

- **RAG / Agent / 应用工程**：核心必会之后，优先选 RAG、Agent、评测与安全、系统设计和工程实践。
- **训练 / 算法 / 后训练**：核心必会之后，优先选预训练与数据、训练与对齐、训练工程及相关数学基础。
- **推理 / 基础设施**：核心必会之后，优先选推理与部署、并发调度、KV Cache、量化、分布式与性能分析。
- **多模态或其他专门方向**：先完成通用核心，再依据职位描述选择对应的岗位专项；简历没有相关经历时，不要为了显得全面而编造项目。

### 面试临近，只剩几天

先从“核心必会 + 目标岗位分类”随机抽题，然后集中重练薄弱题。最后单独准备项目介绍、个人贡献、一次失败或故障、关键取舍和可验证结果；这些内容通常比再浏览一批边缘知识点更能暴露真实能力。

## 参考资料

下面的链接用于解释分级依据，并不意味着其中每个问题都已逐题映射到本站。

**岗位需求与面试结构**

- [AI Engineering Field Guide：895 份岗位描述的技能统计（2026 年 1 月样本）](https://github.com/alexeygrigorev/ai-engineering-field-guide/blob/main/role/02-skills.md)：提供 RAG、Prompt、Agent、Python、评测等技能在该样本中的占比；样本有地域和平台边界，不能视为整个市场。
- [AI Engineering Field Guide：面试流程](https://github.com/alexeygrigorev/ai-engineering-field-guide/blob/main/interview/01-interview-process.md)、[理论题](https://github.com/alexeygrigorev/ai-engineering-field-guide/blob/main/interview/questions/01-theory.md)、[项目深挖](https://github.com/alexeygrigorev/ai-engineering-field-guide/blob/main/interview/questions/03-project-deep-dive.md)与[系统设计](https://github.com/alexeygrigorev/ai-engineering-field-guide/blob/main/interview/questions/04-ai-system-design.md)：用来交叉检查面试能力结构，而不是照单全背。

**候选人公开复盘**

- [奇安信大模型岗位面经（牛客，2025）](https://www.nowcoder.com/discuss/760180233478664192)
- [腾讯 RAG / Agent 岗位面经（牛客，2026）](https://www.nowcoder.com/discuss/878945851924627456)
- [快手大模型岗位面经（牛客，2026）](https://www.nowcoder.com/discuss/882573284426932224)
- [百度大模型强化学习 / 后训练面经（牛客，2026）](https://www.nowcoder.com/discuss/863890669662674944)
- [Amazon AI Engineer 面试复盘（LeetCode，2025）](https://leetcode.com/discuss/post/6871782/)

这些复盘覆盖不同公司、方向和年份，只能作为“真实出现过”的证据。匿名发帖、记忆偏差和团队差异仍然存在，因此不会仅凭一篇复盘把题目列为通用核心。

**工程实践与答案核对**

- [Anthropic：Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Hamel Husain：Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/)
- [Chip Huyen：Building A Generative AI Platform](https://huyenchip.com/2024/07/25/genai-platform.html)
- [Retrieval-Augmented Generation in Industry：13 位从业者访谈研究](https://arxiv.org/abs/2508.14066)
- [PromptLayer：Agentic System Design Interview](https://blog.promptlayer.com/the-agentic-system-design-interview-how-to-evaluate-ai-engineers/)

这些资料主要用于核对工程边界、评测方法和系统设计思路。具体题目的答案仍应优先追溯到对应论文、标准或官方文档。

**更新时间：2026-07-22。** 分级是可修订的学习导航，不是对任何公司题库的承诺。

</div>
