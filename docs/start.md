---
title: 新手使用指南
permalink: /start/
---

<div class="container prose standalone-page onboarding-page" markdown="1">

<div class="onboarding-intro" markdown="1">

<span class="status-badge">首次配置约 5～10 分钟 · 日常新增约 1 分钟</span>

# 建立自己的大模型面经

第一次需要在 GitHub 创建仓库、选择公开或私有，并连接 Pages CMS。完成后，日常新增、修改和删除题目都不需要打开源码，也不需要 Git 命令。

{% if site.github.repository_url %}<a class="primary-button" href="{{ site.github.repository_url }}" data-template-repository="{{ site.github.repository_nwo | escape }}" target="_blank" rel="noopener noreferrer">打开 GitHub 仓库 ↗</a>{% endif %}

</div>

<div class="guide-alert" role="note" markdown="1">

**公开 / 私有不在题库后台设置。** 它位于 GitHub 的“Create a new repository”页面。Pages CMS 负责编辑内容，不能修改仓库可见性。

</div>

## 先确认你需要哪种模式

<div id="mode-choice" class="path-picker">
  <article class="path-card path-public">
    <span class="status-badge status-public">Public</span>
    <strong>公开题库</strong>
    <span>任何人都能通过网址阅读，适合分享面经、作品展示和共同维护。</span>
    <b>创建时选择 Public</b>
  </article>
  <article class="path-card path-private">
    <span class="status-badge status-private">Private</span>
    <strong>私有题库</strong>
    <span>只有本人和受邀者能查看仓库，适合个人复习或包含非公开信息的笔记。</span>
    <b>创建时选择 Private</b>
  </article>
</div>

## 1. 从模板创建仓库

<div class="guide-step">
  <div class="guide-copy">
    <span class="step-number">1</span>
    <h3>打开模板</h3>
    <p>点击上方按钮进入 GitHub，然后选择 <strong>Use this template → Create a new repository</strong>。</p>
    <p class="guide-note"><strong>没有 Use this template？</strong> 优先点击仓库顶部的“generated from”来源；仓库主人也可以在 <strong>Settings → General</strong> 中开启 <strong>Template repository</strong>。</p>
  </div>
  <figure class="guide-figure">
    <a href="{{ '/assets/guides/01-use-template.svg' | relative_url }}" target="_blank" rel="noopener noreferrer" aria-label="放大查看 GitHub 模板按钮示意图（在新窗口打开）"><img src="{{ '/assets/guides/01-use-template.svg' | relative_url }}" loading="lazy" alt="GitHub 仓库页面中 Use this template 按钮的位置示意图"></a>
    <figcaption>图 1：Use this template 的位置。点击图片查看大图。</figcaption>
  </figure>
</div>

## 2. 在创建页选择公开或私有

<div class="guide-step">
  <div class="guide-copy">
    <span class="step-number">2</span>
    <h3>填写仓库信息</h3>
    <p>选择自己的 Owner，填写 Repository name，再到 <strong>Visibility</strong> 选择：</p>
    <ul>
      <li>想发布阅读网页：选择 <strong>Public</strong>。</li>
      <li>只想自己或受邀者查看：选择 <strong>Private</strong>。</li>
    </ul>
    <p>最后点击 <strong>Create repository</strong>。</p>
  </div>
  <figure class="guide-figure">
    <a href="{{ '/assets/guides/02-choose-visibility.svg' | relative_url }}" target="_blank" rel="noopener noreferrer" aria-label="放大查看仓库可见性选项示意图（在新窗口打开）"><img src="{{ '/assets/guides/02-choose-visibility.svg' | relative_url }}" loading="lazy" alt="GitHub 创建仓库表单中 Public 和 Private 选项的位置示意图"></a>
    <figcaption>图 2：公开 / 私有就在 Visibility 中选择。点击查看大图。</figcaption>
  </figure>
</div>

## 3. 只展开你选择的模式

<details id="public-flow" class="mode-details flow-public">
  <summary><span class="status-badge status-public">Public</span><strong>公开题库：启用阅读网页</strong><span class="summary-hint">展开步骤</span></summary>
  <div class="mode-details-body">
    <ol>
      <li>打开新仓库的 <strong>Settings → Pages</strong>。</li>
      <li>在 <strong>Build and deployment → Source</strong> 选择 <strong>GitHub Actions</strong>。项目已经包含工作流，不要再点击 Jekyll 或 Static HTML 的 Configure。</li>
      <li>进入 <strong>Actions → Validate content and deploy public site → Run workflow</strong>，Branch 选择 <code>main</code>，手动运行第一次部署。</li>
      <li>工作流变为绿色后，回到 <strong>Settings → Pages</strong> 点击 <strong>Visit site</strong>。</li>
    </ol>
    <figure class="guide-figure guide-wide">
      <a href="{{ '/assets/guides/03-enable-pages.svg' | relative_url }}" target="_blank" rel="noopener noreferrer" aria-label="放大查看 GitHub Pages 设置示意图（在新窗口打开）"><img src="{{ '/assets/guides/03-enable-pages.svg' | relative_url }}" loading="lazy" alt="GitHub Settings Pages 中选择 GitHub Actions 的操作示意图"></a>
      <figcaption>图 3：这张图只适用于公开题库。点击查看大图。</figcaption>
    </figure>
    <p class="mode-outcome">以后从 Pages CMS 保存题目，会先校验内容，再自动更新公开网页。</p>
  </div>
</details>

<details id="private-flow" class="mode-details flow-private">
  <summary><span class="status-badge status-private">Private</span><strong>私有题库：跳过 Pages</strong><span class="summary-hint">展开步骤</span></summary>
  <div class="mode-details-body">
    <ol>
      <li><strong>不要启用 GitHub Pages</strong>，直接继续连接 Pages CMS。</li>
      <li>需要共同编辑时，在 GitHub 仓库中邀请协作者，并在 Pages CMS 中补充仓库授权。</li>
      <li>每次保存只更新私有仓库并执行内容校验，不会部署公开网页。</li>
    </ol>
    <p class="mode-outcome"><strong>Private repository 不等于 private Pages。</strong> 真正带访问控制的私有 Pages 主要面向 GitHub Enterprise Cloud；机密内容不要发布到 Pages。</p>
  </div>
</details>

<p class="flow-merge-note">两种模式从这里汇合：接下来都使用 Pages CMS 可视化编辑题目。</p>

## 4. 连接可视化管理后台

<div class="guide-step">
  <div class="guide-copy">
    <span class="step-number">4</span>
    <h3>登录并只授权题库</h3>
    <ol>
      <li>打开 <a href="https://app.pagescms.org/" target="_blank" rel="noopener noreferrer">Pages CMS</a>，点击 <strong>Sign in with GitHub</strong>。</li>
      <li>点击 <strong>Install GitHub App</strong>。</li>
      <li>选择 <strong>Only select repositories</strong>。</li>
      <li>只选择刚创建的题库仓库，再点 <strong>Install</strong>。</li>
    </ol>
  </div>
  <figure class="guide-figure">
    <a href="{{ '/assets/guides/04-connect-pages-cms.svg' | relative_url }}" target="_blank" rel="noopener noreferrer" aria-label="放大查看 Pages CMS 授权示意图（在新窗口打开）"><img src="{{ '/assets/guides/04-connect-pages-cms.svg' | relative_url }}" loading="lazy" alt="Pages CMS 登录和 Only select repositories 授权操作示意图"></a>
    <figcaption>图 4：只授权题库仓库，减少不必要的权限。点击查看大图。</figcaption>
  </figure>
</div>

## 5. 新增第一道题

<div class="guide-step">
  <div class="guide-copy">
    <span class="step-number">5</span>
    <h3>填表并保存</h3>
    <ol>
      <li>在 Pages CMS 的 <strong>Open a project</strong> 中打开仓库和 <code>main</code> 分支。</li>
      <li>进入“面试题与解答”，点击 <strong>Add an entry</strong>（手机端显示 <code>+</code>）。</li>
      <li>填写题目、分类、难度、标签、日期和解答。</li>
      <li>暂时不想公开时，关闭“在网站中显示”，先保存为草稿。</li>
      <li>点击 <strong>Save</strong>（手机端是软盘图标）。</li>
    </ol>
  </div>
  <figure class="guide-figure">
    <a href="{{ '/assets/guides/05-add-question.svg' | relative_url }}" target="_blank" rel="noopener noreferrer" aria-label="放大查看 Pages CMS 新增题目示意图（在新窗口打开）"><img src="{{ '/assets/guides/05-add-question.svg' | relative_url }}" loading="lazy" alt="Pages CMS 新增面试题并点击 Save 的表单示意图"></a>
    <figcaption>图 5：答案像普通文档一样编辑，不需要手写 Markdown。点击查看大图。</figcaption>
  </figure>
</div>

<figure class="guide-figure guide-wide">
  <a href="{{ '/assets/guides/06-deploy-success.svg' | relative_url }}" target="_blank" rel="noopener noreferrer" aria-label="放大查看 GitHub Actions 成功状态示意图（在新窗口打开）"><img src="{{ '/assets/guides/06-deploy-success.svg' | relative_url }}" loading="lazy" alt="GitHub Actions 内容校验、构建和部署成功示意图"></a>
  <figcaption>图 6：公开模式会继续部署网页；私有模式只校验并保存内容。点击查看大图。</figcaption>
</figure>

## 已有仓库想改变模式

<div id="visibility-change" class="result-grid">
  <div class="result-card result-public">
    <h3>Private → Public</h3>
    <ol>
      <li>在 <strong>Settings → General → Danger Zone</strong> 修改 Visibility。</li>
      <li>按上面的公开流程启用 Pages。</li>
      <li>手动运行一次部署工作流。</li>
    </ol>
  </div>
  <div class="result-card result-private">
    <h3>Public → Private</h3>
    <ol>
      <li>先在 <strong>Settings → Pages</strong> 停止发布并确认网站下线。</li>
      <li>再到 Danger Zone 修改 Visibility。</li>
      <li>已经公开过的内容可能仍有缓存，不能当作从未公开。</li>
    </ol>
  </div>
</div>

## 常见问题

- **Pages CMS 看不到仓库**：点击账号旁的齿轮或 **Manage GitHub App**，补选仓库并保存。
- **保存时提示错误**：确认所有 Required 字段都已填写；题目至少 4 个字符。
- **公开题库保存后网页没更新**：打开 GitHub Actions，查看校验或部署是否出现红色错误。
- **私有题库没有阅读网址**：这是预期行为，请直接收藏 [Pages CMS](https://app.pagescms.org/) 作为编辑入口。
- **组织账号没有某个按钮**：可能被组织策略限制，需要组织管理员批准。

</div>
