---
title: "Jacobian、Hessian 分别描述什么，为什么大模型训练很少显式构造 Hessian？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "数学基础"
difficulty: "困难"
study_tier: "role"
tags:
  - Jacobian
  - Hessian
  - 二阶优化
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

按输出维度区分最清楚：向量函数的一阶导是 Jacobian，标量损失对参数的二阶导是 Hessian。写出形状后，说明大模型参数量为 $$n$$ 时完整 Hessian 有 $$n^2$$ 个元素，存储和计算都不可行。追问二阶信息时，回答实际使用 VJP、HVP、Lanczos 或近似曲率，不要说完全不用二阶信息。

**可以这样答：**

> 对于 $$f:\mathbb{R}^n\to\mathbb{R}^m$$，Jacobian 是 $$m\times n$$ 的一阶偏导矩阵；对于标量损失，Hessian 是 $$n\times n$$ 的二阶偏导矩阵，描述不同方向的局部曲率。大模型参数量 $$n$$ 极大，完整 Hessian 的存储就是平方级，因此训练中通常不显式构造。需要相关信息时，会计算向量—Jacobian 积、Hessian—向量积，或用 Lanczos 等方法近似谱性质。

## 核心回答

若 $$f:\mathbb{R}^n\to\mathbb{R}^m$$，Jacobian $$J_{ij}=\partial f_i/\partial x_j$$，描述输入微小变化如何线性影响多个输出。若 $$\mathcal{L}:\mathbb{R}^n\to\mathbb{R}$$，Hessian $$H_{ij}=\partial^2\mathcal{L}/(\partial x_i\partial x_j)$$，是梯度对参数的导数；在二阶连续条件下通常对称，其特征向量和特征值描述局部曲率方向与强度。

对数十亿参数，Hessian 有 $$O(n^2)$$ 个元素，不可能显式存储。自动微分能直接计算 $$Jv$$、$$v^\top J$$ 或 $$Hv$$，成本接近若干次前后向。共轭梯度、Lanczos、Gauss–Newton、Fisher 或块对角近似都利用这种矩阵自由乘积。

## 展开说明

梯度只给局部最陡上升方向，Hessian 还能区分平坦、尖锐和负曲率方向。Newton 步理论上为 $$-H^{-1}g$$，但深网 Hessian 可能不正定、病态且随 mini-batch 有噪声，直接求逆既昂贵也可能走向鞍点方向。

反向传播本质上高效计算标量 loss 对大量参数的 VJP。完整 Jacobian 通常没有必要，因为优化只需要它与某个向量的乘积。

## 工程实践

自定义算子用 JVP/VJP 与有限差分小规模核对；训练不稳定时可用 power iteration 配合 HVP 估计最大特征值，观察学习率是否相对曲率过大。二阶统计要固定 batch 和精度，记录估计方差，并结合逐层梯度 RMS、更新参数比和非有限值定位。

## 常见追问

1. **梯度、Jacobian 和 Hessian 的维度分别是什么？** 标量对 $$n$$ 维输入的梯度是 $$n$$ 维；$$m$$ 维输出的 Jacobian 是 $$m\times n$$；标量 loss 的 Hessian 是 $$n\times n$$。
2. **Hessian 为什么可能有负特征值？** 非凸目标在某些方向向上弯、另一些方向向下弯，负特征值表示局部存在负曲率。
3. **HVP 为什么不需要显式 Hessian？** 先求梯度与向量的内积，再对参数求一次导数即可得到 $$Hv$$，自动微分能按计算图完成。
4. **Fisher 与 Hessian 完全相同吗？** 不完全相同。特定期望条件下二者有关系，但经验 Fisher、Gauss–Newton 与真实 Hessian 定义不同。

## 一句话复习

> Jacobian 管一阶映射，Hessian 管二阶曲率；大模型只算向量乘积，不构造平方级矩阵。

## 参考资料

- [Automatic Differentiation in Machine Learning: a Survey](https://arxiv.org/abs/1502.05767)
- [Deep Learning Book：Numerical Computation](https://www.deeplearningbook.org/contents/numerical.html)
