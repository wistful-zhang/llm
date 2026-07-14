---
title: "Jacobian、Hessian 分别描述什么，为什么大模型训练很少显式构造 Hessian？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "数学基础"
difficulty: "困难"
tags:
  - Jacobian
  - Hessian
  - 二阶优化
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论：** Jacobian 收集向量函数的一阶偏导，Hessian 是标量函数梯度的 Jacobian，描述局部曲率。
2. **再讲关键机制：** 给出维度并解释 JVP、VJP、HVP 能在不构造完整矩阵时计算需要的乘积。
3. **主动说取舍：** 二阶曲率可改善步长方向，却有计算、显存和非凸负曲率问题，大模型多用一阶或近似二阶方法。
4. **最后落到项目：** 用 HVP 估计最大特征值，结合梯度范数、loss spike 和步长排查稳定性；讲完停。

**60 秒口述示例：**

> 我会先按对象区分：`f:R^n→R^m` 的 Jacobian 是 `m×n` 一阶导矩阵；标量 loss 的 Hessian 是 `n×n` 二阶导，反映不同方向的局部曲率。神经网络参数 n 极大，完整 Hessian 的存储是平方级，所以实际用反向模式算 VJP，或用 HVP 和近似曲率。项目里我会估计最大曲率、看梯度范数和 loss spike，而不尝试保存整张矩阵。 若追问二阶法，我再讲共轭梯度和 Lanczos。

## 核心回答

若 `f:R^n→R^m`，Jacobian `J_{ij}=∂f_i/∂x_j`，描述输入微小变化如何线性影响多个输出。若 `L:R^n→R`，Hessian `H_{ij}=∂²L/(∂x_i∂x_j)`，是梯度对参数的导数；在二阶连续条件下通常对称，其特征向量和特征值描述局部曲率方向与强度。

对数十亿参数，Hessian 有 `O(n²)` 元素，不可能显式存储。自动微分能直接计算 `Jv`、`vᵀJ` 或 `Hv`，成本接近若干次前后向。共轭梯度、Lanczos、Gauss–Newton、Fisher 或块对角近似都利用这种矩阵自由乘积。

## 展开说明

梯度只给局部最陡上升方向，Hessian 还能区分平坦、尖锐和负曲率方向。Newton 步理论上为 `-H^{-1}g`，但深网 Hessian 可能不正定、病态且随 mini-batch 有噪声，直接求逆既昂贵也可能走向鞍点方向。

反向传播本质上高效计算标量 loss 对大量参数的 VJP。完整 Jacobian 通常没有必要，因为优化只需要它与某个向量的乘积。

## 工程实践

自定义算子用 JVP/VJP 与有限差分小规模核对；训练不稳定时可用 power iteration 配合 HVP 估计最大特征值，观察学习率是否相对曲率过大。二阶统计要固定 batch 和精度，记录估计方差，并结合逐层梯度 RMS、更新参数比和非有限值定位。

## 常见追问

1. **梯度、Jacobian 和 Hessian 的维度分别是什么？** 标量对 n 维输入的梯度是 n 维；m 维输出的 Jacobian 是 `m×n`；标量 loss 的 Hessian 是 `n×n`。
2. **Hessian 为什么可能有负特征值？** 非凸目标在某些方向向上弯、另一些方向向下弯，负特征值表示局部存在负曲率。
3. **HVP 为什么不需要显式 Hessian？** 先求梯度与向量的内积，再对参数求一次导数即可得到 `Hv`，自动微分能按计算图完成。
4. **Fisher 与 Hessian 完全相同吗？** 不完全相同。特定期望条件下二者有关系，但经验 Fisher、Gauss–Newton 与真实 Hessian 定义不同。

## 一句话复习

> Jacobian 管一阶映射，Hessian 管二阶曲率；大模型只算向量乘积，不构造平方级矩阵。

## 参考资料

- [Automatic Differentiation in Machine Learning: a Survey](https://arxiv.org/abs/1502.05767)
- [Deep Learning Book：Numerical Computation](https://www.deeplearningbook.org/contents/numerical.html)
