---
title: 管理我的题库
permalink: /manage/
---

<div class="container prose standalone-page manage-page onboarding-page" markdown="1">

<span class="status-badge">无需源码 · 表单编辑</span>

# 在网页上新增题目

Pages CMS 会把题目、分类、难度、标签和解答显示成普通表单。只有仓库所有者或协作者能保存；普通访客只能阅读公开题库。

<a class="primary-button cms-button" href="https://app.pagescms.org/" target="_blank" rel="noopener noreferrer">打开 Pages CMS ↗</a>
<a class="secondary-button" href="{{ '/start/' | relative_url }}">第一次使用？看完整图解</a>

## 第一次授权

第一次打开时，点击 **Sign in with GitHub → Install GitHub App → Only select repositories**，只选择自己的题库仓库。

<figure class="guide-figure guide-wide">
  <a href="{{ '/assets/guides/04-connect-pages-cms.svg' | relative_url }}" target="_blank"><img src="{{ '/assets/guides/04-connect-pages-cms.svg' | relative_url }}" loading="lazy" alt="Pages CMS 登录并只授权题库仓库的示意图"></a>
  <figcaption>只需授权一次。看不到仓库时，用 Manage GitHub App 补选仓库。</figcaption>
</figure>

## 以后每次新增只要 3 步

<ol class="daily-steps">
  <li><strong>打开项目</strong><span>在 Open a project 中找到题库，选择 `main` 分支。</span></li>
  <li><strong>填写表单</strong><span>进入“面试题与解答”，点击 Add an entry。</span></li>
  <li><strong>保存并等待</strong><span>点击 Save；公开模式等待 Actions 变绿后刷新网站。</span></li>
</ol>

<figure class="guide-figure guide-wide">
  <a href="{{ '/assets/guides/05-add-question.svg' | relative_url }}" target="_blank"><img src="{{ '/assets/guides/05-add-question.svg' | relative_url }}" loading="lazy" alt="Pages CMS 新增题目表单和 Save 按钮示意图"></a>
  <figcaption>题目和答案都通过表单填写，不需要 Markdown 或 Git 命令。</figcaption>
</figure>

<figure class="guide-figure guide-wide">
  <a href="{{ '/assets/guides/06-deploy-success.svg' | relative_url }}" target="_blank"><img src="{{ '/assets/guides/06-deploy-success.svg' | relative_url }}" loading="lazy" alt="GitHub Actions 自动发布成功示意图"></a>
  <figcaption>公开模式：Actions 变绿代表网页更新完成。私人模式：内容只保存到私有仓库。</figcaption>
</figure>

## 题目解答怎么写

在富文本编辑器里，可以依次写：核心回答、展开说明、工程实践、常见追问、一句话复习。编辑器提供标题、列表、加粗、引用和代码块按钮。

## 后台还能做什么

- 新增、修改和删除题目
- 输入已有分类或创建新分类
- 调整难度、标签和整理日期
- 修改网站名称、首页介绍和主题颜色
- 修改页脚和首页主标题

## 公开 / 私有在哪里修改

Pages CMS 没有公开/私有开关。可见性属于 GitHub 仓库设置：

**GitHub 仓库 → Settings → General → Danger Zone → Change repository visibility**

私人题库不要启用公开 Pages。详细区别请查看[公开与私人图解]({{ '/start/' | relative_url }}#public-flow)。

## 常见问题

- **看不到仓库**：点击 Pages CMS 账号旁齿轮或 Manage GitHub App，补选仓库。
- **无法保存**：确认所有 Required 字段都已填写。
- **网页没有更新**：在 GitHub Actions 中查看是否仍在运行或出现红色错误。
- **想换颜色或标题**：打开 Pages CMS 的“站点设置”，不需要改源码。

</div>
