---
title: 新手使用指南
permalink: /start/
---

<div class="container prose standalone-page onboarding-page" markdown="1">

<div class="onboarding-intro" markdown="1">

<span class="status-badge">零基础 · 约 3 分钟</span>

# 建立自己的大模型面经

按图操作即可。第一次需要进入 GitHub 创建仓库并授权 Pages CMS；完成后，日常新增题目不需要看源码，也不需要写 Markdown。

{% if site.github.repository_url %}<a class="primary-button" href="{{ site.github.repository_url }}/generate" target="_blank" rel="noopener noreferrer">打开 GitHub 模板创建页 ↗</a>{% endif %}

</div>

<div class="guide-alert" role="note" markdown="1">

**公开 / 私有不在题库后台设置。** 它位于 GitHub 的“Create a new repository”页面。Pages CMS 只能编辑内容，不能修改仓库可见性。

</div>

## 第一步：先选择你想要的模式

<div class="path-picker">
  <a class="path-card path-public" href="#public-flow">
    <span class="path-icon" aria-hidden="true">◎</span>
    <span class="status-badge status-public">可公开分享</span>
    <strong>公开题库</strong>
    <span>任何人都能通过网址阅读；GitHub Free 可使用 Pages。</span>
    <b>选择公开流程 ↓</b>
  </a>
  <a class="path-card path-private" href="#private-flow">
    <span class="path-icon" aria-hidden="true">⌾</span>
    <span class="status-badge status-private">仅受邀者</span>
    <strong>私人题库</strong>
    <span>只有本人和受邀协作者能查看仓库；不要启用公开 Pages。</span>
    <b>选择私人流程 ↓</b>
  </a>
</div>

## 第二步：从模板创建仓库

<div class="guide-step">
  <div class="guide-copy" markdown="1">
    <span class="step-number">1</span>
    ### 打开模板

    在项目的 GitHub 页面点击 **Use this template**，再选 **Create a new repository**。
  </div>
  <figure class="guide-figure">
    <a href="{{ '/assets/guides/01-use-template.svg' | relative_url }}" target="_blank"><img src="{{ '/assets/guides/01-use-template.svg' | relative_url }}" loading="lazy" alt="GitHub 仓库页面中 Use this template 按钮的位置示意图"></a>
    <figcaption>图 1：点击图片可放大。GitHub 界面可能更新，以英文按钮文字为准。</figcaption>
  </figure>
</div>

<div class="guide-step">
  <div class="guide-copy" markdown="1">
    <span class="step-number">2</span>
    ### 选择 Public 或 Private

    填写 Owner 和 Repository name，然后在 **Visibility** 区域选择：

    - 想让别人通过网页阅读：选 **Public**。
    - 只想自己或受邀者查看：选 **Private**。
  </div>
  <figure class="guide-figure">
    <a href="{{ '/assets/guides/02-choose-visibility.svg' | relative_url }}" target="_blank"><img src="{{ '/assets/guides/02-choose-visibility.svg' | relative_url }}" loading="lazy" alt="GitHub 创建仓库表单中 Public 和 Private 选项的位置示意图"></a>
    <figcaption>图 2：你之前找不到的公开/私有选项就在这里。</figcaption>
  </figure>
</div>

<section id="public-flow" class="flow-section flow-public" markdown="1">

## 公开流程：启用漂亮网页

<span class="status-badge status-public">Public 仓库</span>

创建完成后打开仓库的 **Settings → Pages**，在 **Build and deployment → Source** 选择 **GitHub Actions**。项目已经自带工作流，不要再点击 Jekyll 或 Static HTML 的 Configure。

<figure class="guide-figure guide-wide">
  <a href="{{ '/assets/guides/03-enable-pages.svg' | relative_url }}" target="_blank"><img src="{{ '/assets/guides/03-enable-pages.svg' | relative_url }}" loading="lazy" alt="GitHub Settings Pages 中选择 GitHub Actions 的操作示意图"></a>
  <figcaption>图 3：公开题库需要启用 Pages；私人题库跳过此步骤。</figcaption>
</figure>

首次部署可以进入 **Actions → Deploy question bank to GitHub Pages → Run workflow**，Branch 选择 `main`。成功后回到 **Settings → Pages** 点击 **Visit site**。

</section>

<section id="private-flow" class="flow-section flow-private" markdown="1">

## 私人流程：不要启用 Pages

<span class="status-badge status-private">Private 仓库</span>

创建 Private 仓库后直接连接 Pages CMS。免费个人方案下，私人模式没有公开的漂亮网页；需要分享给特定人员时，在 GitHub 仓库中邀请他们成为协作者。

> **重要：Private repository 不等于 private Pages。** 普通 Pages 网站应视为公开内容；真正带访问控制的 Private Pages 主要面向 GitHub Enterprise Cloud。机密内容不要发布到 Pages。

</section>

## 第三步：连接可视化管理后台

<div class="guide-step">
  <div class="guide-copy" markdown="1">
    <span class="step-number">3</span>
    ### 登录并只授权题库

    1. 打开 [Pages CMS](https://app.pagescms.org/)，点击 **Sign in with GitHub**。
    2. 点击 **Install GitHub App**。
    3. 选择 **Only select repositories**。
    4. 只选择刚创建的题库仓库，再点 **Install**。
  </div>
  <figure class="guide-figure">
    <a href="{{ '/assets/guides/04-connect-pages-cms.svg' | relative_url }}" target="_blank"><img src="{{ '/assets/guides/04-connect-pages-cms.svg' | relative_url }}" loading="lazy" alt="Pages CMS 登录和 Only select repositories 授权操作示意图"></a>
    <figcaption>图 4：不要选择 All repositories，减少不必要的权限。</figcaption>
  </figure>
</div>

## 第四步：新增第一道题

<div class="guide-step">
  <div class="guide-copy" markdown="1">
    <span class="step-number">4</span>
    ### 填表并保存

    回到 Pages CMS 的 **Open a project**，打开仓库和 `main` 分支：

    1. 进入“面试题与解答”。
    2. 点击 **Add an entry**（手机端显示 `+`）。
    3. 填写题目、分类、难度、标签、日期和解答。
    4. 点击右上角 **Save**（手机端是软盘图标）。
  </div>
  <figure class="guide-figure">
    <a href="{{ '/assets/guides/05-add-question.svg' | relative_url }}" target="_blank"><img src="{{ '/assets/guides/05-add-question.svg' | relative_url }}" loading="lazy" alt="Pages CMS 新增面试题并点击 Save 的表单示意图"></a>
    <figcaption>图 5：答案编辑器和普通文档一样，不需要手写格式。</figcaption>
  </figure>
</div>

<figure class="guide-figure guide-wide">
  <a href="{{ '/assets/guides/06-deploy-success.svg' | relative_url }}" target="_blank"><img src="{{ '/assets/guides/06-deploy-success.svg' | relative_url }}" loading="lazy" alt="GitHub Actions 内容校验、构建和部署成功示意图"></a>
  <figcaption>图 6：公开模式保存后，等待 Actions 变绿再刷新网站；私人模式只保存到私有仓库。</figcaption>
</figure>

## 最终结果对照

<div class="result-grid">
  <div class="result-card result-public" markdown="1">
  ### 公开题库

  - 有公开阅读网址
  - 任何人能看，只有协作者能编辑
  - 保存后自动部署
  </div>
  <div class="result-card result-private" markdown="1">
  ### 私人题库

  - 没有公开网址
  - 只有本人和受邀者能进入仓库/CMS
  - 不会自动公开内容
  </div>
</div>

## 已有仓库想改公开或私有

进入 GitHub 仓库：**Settings → General → Danger Zone → Change repository visibility**。更改为 Private 前先确认 Pages 已下线；已经公开过的内容可能仍存在缓存，不能当作从未泄露。

## 常见问题

- **Pages CMS 看不到仓库**：点击账号旁的齿轮或 **Manage GitHub App**，补选仓库并保存。
- **保存时提示错误**：把所有 Required 字段填完，再点 Save。
- **保存后网页没更新**：打开 GitHub 的 Actions，等待工作流变成绿色 Success。
- **组织账号没有某个按钮**：可能被组织策略限制，需要组织管理员批准。

</div>

