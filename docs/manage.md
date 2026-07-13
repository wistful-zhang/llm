---
title: 管理题库
permalink: /manage/
---

<div class="container prose standalone-page manage-page" markdown="1">

# 在网页上新增题目

不需要学习 Markdown 或 Git 命令。管理后台会把题目、分类、难度、标签和解答显示成普通表单；点击保存后，它会自动提交到 GitHub，网站通常会在几分钟内更新。

<a class="primary-button cms-button" href="https://app.pagescms.org/" target="_blank" rel="noopener noreferrer">打开题库管理后台 ↗</a>

## 第一次使用

1. 点击上面的按钮，选择 **Sign in with GitHub**。
2. 安装 Pages CMS GitHub App 时选择 **Only select repositories**。
3. 只勾选你用来保存题库的仓库，不要授予其他仓库权限。
4. 打开该仓库的 `main` 分支，选择“面试题与解答”。
5. 点击“New 面试题与解答”，填写表单并保存。

## 填写建议

在“题目解答”编辑器里，可以按这个顺序写：核心回答、展开说明、工程实践、常见追问、一句话复习。编辑器提供标题、列表、加粗、引用和代码块按钮，不需要手写格式。

> 管理后台只有获得仓库写入权限的 GitHub 用户才能保存内容。普通网站访客无法修改题库。

如果这是从模板创建的新仓库，你还可以在“站点设置”中直接修改网站名称、介绍、首页文案、主题配色和页脚。

## 日常使用不需要源码

完成第一次 GitHub App 授权后，以下操作都可以在管理后台完成：

- 新增、修改和删除题目
- 输入已有分类或创建新分类
- 调整难度、标签和整理日期
- 使用富文本编辑器编写答案、列表、引用和代码块
- 修改网站名称、首页介绍和主题颜色

只有修改网页布局、开发新功能或排查底层构建故障时才需要接触源码。

</div>
