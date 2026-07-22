---
title: "RAG 文档入库时如何处理 PDF 版面、表格、页眉页脚与 OCR？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "RAG"
difficulty: "中等"
study_tier: "core"
tags:
  - 文档解析
  - OCR
  - 表格
published: true
answer_status: complete
verified: true
date: 2026-07-14
---

## 面试时怎么答

开头强调“先恢复文档结构，再切块”。随后按输入类型讲：原生 PDF 取文本层并恢复阅读顺序，扫描件走 OCR，表格保留行列关系，页眉页脚通过跨页重复检测清理，同时保存页码和坐标。

若问为什么不用 VLM 全部解析，说明它在复杂版面上更强，但成本、速度和生成错误都要评估；实际会按文件类型和置信度路由解析器。

**可以这样答：**

> PDF 入库不能只抽出一串文本，否则多栏顺序、表格关系和页码会丢失。应先识别标题、段落、列表、表格、图片说明与阅读顺序：原生文件优先解析文本层，扫描页再做 OCR，表格单独恢复行列结构，页眉页脚按跨页重复清理，并保存页码与坐标。复杂页面可路由到版面模型或 VLM，但要用解析准确率、引用页码和单页成本验收。

## 核心回答

文档入库的第一目标不是得到“尽可能多的字符”，而是恢复可检索的语义元素及其出处。应识别 Title、NarrativeText、List、Table、Figure Caption、Header、Footer、Page Number 等元素，保留文件 ID、页码、Bounding Box、父标题和阅读顺序。Chunking 在元素之后进行，避免把两个栏目、两个章节或表格行错误拼接。

原生数字 PDF 优先读取文本层并结合版面；扫描件或文字层质量差时再用 OCR。表格应保留行列关系，可同时生成 HTML/Markdown 表示和面向检索的描述，但描述属于生成内容，回答时仍要回到原表。页眉页脚可通过跨页位置与重复文本检测清理，不能用全局字符串规则误删正文。

## 展开说明

解析器路由可以依据 MIME、是否有文本层、乱码率、页面图像占比和版面复杂度。复杂表格、公式和图表可升级到专用模型或 VLM，但要保留原页图供核验。解析失败应进入可见的隔离队列，不能静默产出空索引。

Chunk 应携带 `orig_elements` 或等价血缘，使合并后的文本仍可恢复页码和坐标。文档更新时以文件内容哈希和解析配置版本决定是否重建。

## 工程实践

建立包含单栏、多栏、扫描、旋转页、合并单元格、页眉脚和公式的金标集。分别评估文字错误率、阅读顺序、表格单元格/结构 F1、元素分类、空页率、Chunk 检索 Recall@K、引用页码正确率、每页 P95 解析时间与成本。

## 常见追问

1. **为什么所有 PDF 都直接走 OCR 不合理？** 原生文本层通常更快、更准且保留字符；OCR 会增加成本并引入识别错误，应按页面质量路由。
2. **表格应该怎样 Chunk？** 尽量保留表头与行列关系，大表按行组切分并重复必要表头；不要把单元格按纯字符长度任意截断。
3. **怎样删除页眉页脚而不误删正文？** 结合跨页重复、固定坐标区域和版面类型判断，并保留可审计原元素；只靠字符串出现次数容易误删标题或条款。

## 一句话复习

> RAG 入库先恢复结构与血缘，再按元素切块；OCR、表格和复杂版面都应有独立质量门禁。

## 参考资料

- 面经主题：[公开 LLM 面试题主题汇总](https://github.com/llmgenai/LLMInterviewQuestions)
- 官方文档：[Unstructured Document Elements and Metadata](https://docs.unstructured.io/open-source/concepts/document-elements)
- 官方文档：[Unstructured Chunking](https://docs.unstructured.io/open-source/core-functionality/chunking)
- 官方示例：[Docling Export Tables](https://docling-project.github.io/docling/_generated/examples/export_tables/)
