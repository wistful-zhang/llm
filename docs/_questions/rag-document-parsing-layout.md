---
title: "RAG 文档入库时如何处理 PDF 版面、表格、页眉页脚与 OCR？"
source: "公开面经题库主题；公司归属未独立核验，技术答案依据原论文或官方文档整理"
review_status: "待复习"
category: "RAG"
difficulty: "中等"
tags:
  - 文档解析
  - OCR
  - 表格
published: true
verified: true
date: 2026-07-14
---

## 面试时怎么答

建议按“结论 → 原理 → 取舍 → 落地”回答：

1. **先给结论**：先说高质量 RAG 要先恢复文档元素、阅读顺序和来源坐标，再做 Chunk；结论后停顿。
2. **再讲关键机制**：按原生文本抽取、版面检测、扫描页 OCR、表格结构恢复和元素级清洗回答。
3. **主动说取舍**：指出纯文本管线快但会打乱多栏与表格，VLM/OCR 更强却更慢且可能生成错误。
4. **最后落到项目**：按文件类型路由解析器，保留页码与坐标，监控解析成功率、表格 F1、检索 Recall、引用率和成本。

**60 秒口述示例：**

> 我的结论是，PDF 入库不能先抽成一长串文本再切块，而要先恢复标题、段落、列表、表格、图片说明、页码和阅读顺序。这里停一下，再说原生 PDF 优先解析文本层，扫描件才走 OCR，表格按行列结构单独保存，页眉页脚做跨页重复检测。项目里按文件类型路由解析器，并用解析成功率、表格单元格 F1、检索 Recall@K、引用页码正确率和单页成本验收。

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
