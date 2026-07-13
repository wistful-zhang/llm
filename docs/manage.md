---
title: 网页编辑题库
permalink: /manage/
---

<div class="container prose standalone-page manage-page onboarding-page" markdown="1">

<span class="status-badge">无需源码 · 表单编辑</span>

# 在网页上新增题目

<div class="owner-notice" role="note">
  <strong>这是题库主人的编辑入口。</strong>
  <span>只有拥有目标仓库写入权限的 GitHub 用户才能保存；其他访客请返回题库阅读。</span>
</div>

Pages CMS 会把题目、分类、难度、标签和解答显示成普通表单。首次授权完成后，日常新增、修改和删除题目不需要打开源码，也不需要 Git 命令。

<a class="primary-button cms-button" href="https://app.pagescms.org/" target="_blank" rel="noopener noreferrer">打开 Pages CMS ↗</a>
<a class="secondary-button" href="{{ '/start/' | relative_url }}">第一次使用？看完整图解</a>

## 第一次授权

第一次打开时，点击 **Sign in with GitHub → Install GitHub App → Only select repositories**，只选择自己的题库仓库。

<figure class="guide-figure guide-wide">
  <a href="{{ '/assets/guides/04-connect-pages-cms.svg' | relative_url }}" target="_blank" rel="noopener noreferrer" aria-label="放大查看 Pages CMS 授权示意图（在新窗口打开）"><img src="{{ '/assets/guides/04-connect-pages-cms.svg' | relative_url }}" loading="lazy" alt="Pages CMS 登录并只授权题库仓库的示意图"></a>
  <figcaption>只需授权一次。看不到仓库时，用 Manage GitHub App 补选仓库。点击查看大图。</figcaption>
</figure>

## 以后每次新增只要 3 步

<ol class="daily-steps">
  <li><strong>打开项目</strong><span>在 Open a project 中找到题库，选择 <code>main</code> 分支。</span></li>
  <li><strong>填写表单</strong><span>进入“面试题与解答”，点击 Add an entry。</span></li>
  <li><strong>保存并检查</strong><span>点击 Save，确认内容校验变为绿色。</span></li>
</ol>

<figure class="guide-figure guide-wide">
  <a href="{{ '/assets/guides/05-add-question.svg' | relative_url }}" target="_blank" rel="noopener noreferrer" aria-label="放大查看 Pages CMS 新增题目示意图（在新窗口打开）"><img src="{{ '/assets/guides/05-add-question.svg' | relative_url }}" loading="lazy" alt="Pages CMS 新增题目表单和 Save 按钮示意图"></a>
  <figcaption>题目和答案都通过表单填写，不需要 Markdown 或 Git 命令。点击查看大图。</figcaption>
</figure>

<figure class="guide-figure guide-wide">
  <a href="{{ '/assets/guides/06-deploy-success.svg' | relative_url }}" target="_blank" rel="noopener noreferrer" aria-label="放大查看 GitHub Actions 成功状态示意图（在新窗口打开）"><img src="{{ '/assets/guides/06-deploy-success.svg' | relative_url }}" loading="lazy" alt="GitHub Actions 自动校验和发布成功示意图"></a>
  <figcaption>公开题库：校验后继续更新网页。私有题库：只校验并保存到私有仓库。点击查看大图。</figcaption>
</figure>

{% if site.github.repository_url %}<div class="manage-actions"><a class="secondary-button" href="{{ site.github.repository_url }}/actions/workflows/pages.yml" target="_blank" rel="noopener noreferrer">检查保存 / 发布状态 ↗</a><a class="secondary-button" href="{{ '/' | relative_url }}">返回题库</a></div>{% endif %}

## 题目解答怎么写

在富文本编辑器里，可以依次写：核心回答、展开说明、工程实践、常见追问、一句话复习。编辑器提供标题、列表、加粗、引用和代码块按钮。

## 后台还能做什么

- 新增、修改和删除题目
- 关闭“在网站中显示”，把未完成内容保存为草稿
- 输入已有分类或创建新分类
- 调整难度、标签和整理日期
- 修改网站名称、首页介绍、两行标题和主题颜色
- 修改页脚文字

站点设置文件已禁止从后台删除，题目标题和首页文案也设置了长度限制，减少误操作导致构建失败的情况。

## 公开 / 私有在哪里修改

Pages CMS 没有公开 / 私有开关：

- **创建新仓库时**：在 Create a new repository 页面的 **Visibility** 中选择。
- **已有仓库**：进入 **Settings → General → Danger Zone → Change repository visibility**。

从公开改为私有前，要先停止 Pages 发布；从私有改为公开后，要启用 Pages 并手动运行一次工作流。具体操作见[模式选择与切换图解]({{ '/start/' | relative_url }}#mode-choice)。

## 常见问题

- **看不到仓库**：点击 Pages CMS 账号旁齿轮或 Manage GitHub App，补选仓库。
- **无法保存**：确认所有 Required 字段都已填写，题目不少于 4 个字符。
- **公开网页没有更新**：点击上方“检查保存 / 发布状态”，查看是否仍在运行或出现红色错误。
- **私有题库没有网站入口**：这是预期行为，请直接收藏 [Pages CMS](https://app.pagescms.org/)。
- **想换颜色或标题**：打开 Pages CMS 的“站点设置”，不需要改源码。

</div>
