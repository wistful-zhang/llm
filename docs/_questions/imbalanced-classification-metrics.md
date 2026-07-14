---
title: "类别不平衡时 Precision、Recall、F1、ROC-AUC 与 PR-AUC 怎么选？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "NLP 与机器学习"
difficulty: "简单"
tags:
  - 分类指标
  - 类别不平衡
  - PR-AUC
published: true
verified: true
date: 2026-07-14
---

## 核心回答

Precision 关心预测为正的样本有多少是真的，Recall 关心真实正例找回多少，F1 是二者的调和平均。ROC-AUC 衡量随机正例得分高于随机负例的概率，对阈值不敏感，但负例极多时即使假阳性率很小，假阳性绝对数也可能不可接受。PR-AUC 更聚焦稀少正类，通常更能反映不平衡任务；最终仍应按业务误报、漏报成本选择阈值，并同时报告混淆矩阵和校准情况。

## 展开说明

准确率在 1% 正例任务中可能被“全预测为负”轻易做高。F1 忽略真负例且默认 Precision、Recall 同等重要，需要不同权重时可用 `Fβ`。ROC-AUC 和 PR-AUC 都是排序指标，不能说明某个生产阈值下的实际成本；不同数据基准正例率变化时，Precision 和 PR 曲线也会变化。

## 工程实践

先确定正类和错误成本，再在独立验证集上按约束选阈值，例如“Recall 至少 95% 时最大化 Precision”。上线报告应包含每类支持数、宏/微平均、关键子群体指标、校准曲线和单位流量误报数。若阈值频繁调整，应另留校准集，避免在测试集上过拟合。

## 常见追问

1. **Macro-F1 与 Micro-F1 有何区别？** Macro 对每类 F1 等权，更关注少数类；Micro 汇总所有样本计数，容易被多数类主导。
2. **AUC 很高为什么线上仍可能很差？** AUC 衡量全阈值排序，线上只使用一个阈值，而且真实基准率、成本和数据分布可能不同。
3. **PR-AUC 能跨数据集直接比较吗？** 要谨慎，PR 的基线随正例率变化；应同时报告基准率并尽量在相同分布上比较。

## 一句话复习

> 不平衡分类不要看 Accuracy；先按业务成本选 Precision/Recall 约束，再用 PR-AUC 看排序并用阈值指标确认可用性。

## 参考资料

- 面试主题：[Machine Learning System Design Questions](https://github.com/alirezadir/machine-learning-interviews/blob/main/src/MLSD/ml-system-design.md)
- 技术依据：[scikit-learn：Metrics and scoring](https://scikit-learn.org/stable/modules/model_evaluation.html)
