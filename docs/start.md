---
title: 新手使用指南
permalink: /start/
---

<div class="container prose standalone-page onboarding-page" markdown="1">

<div class="onboarding-intro" markdown="1">

<span class="status-badge">首次配置约 5～10 分钟 · 日常速记约 1～2 分钟</span>

# 建立自己的大模型面经

第一次需要在 GitHub 创建仓库、选择公开或私有，并连接 Pages CMS。完成后，日常新增、修改和删除题目都不需要打开源码，也不需要 Git 命令。

</div>

<nav class="journey-grid" aria-label="选择当前目标">
  <a class="journey-card" href="{{ '/practice/' | relative_url }}"><strong>我只想先练习</strong><span>直接按分类随机抽题，不需要 GitHub 账号。</span><b>开始模拟面试 →</b></a>
  <a class="journey-card" href="{{ '/manage/' | relative_url }}#capture-workflow"><strong>我已有自己的题库</strong><span>刚面试完时，直接用网页表单快速记题。</span><b>进入速记流程 →</b></a>
  <a class="journey-card" href="#mode-choice"><strong>我是第一次创建</strong><span>继续下面 5 步，先决定公开还是私有。</span><b>开始首次配置 ↓</b></a>
</nav>

<div class="guide-alert" role="note" markdown="1">

**公开 / 私有不在题库后台设置。** 它位于 GitHub 的“Create a new repository”页面。Pages CMS 负责编辑内容，不能修改仓库可见性。

</div>

## 先确认你需要哪种模式

<div id="mode-choice" class="path-picker">
  <a class="path-card path-public" href="#public-flow" data-open-details="public-flow">
    <span class="status-badge status-public">Public</span>
    <strong>公开题库</strong>
    <span>适合分享整理后的面经。网站和仓库内容都公开；即使题目未发布到网站，草稿源文件仍可见。</span>
    <b>我选公开 →</b>
  </a>
  <a class="path-card path-private" href="#private-flow" data-open-details="private-flow">
    <span class="status-badge status-private">Private</span>
    <strong>私有题库</strong>
    <span>只有本人和受邀者能查看仓库，适合保存原始面试速记和个人复习内容；不部署公开网站。</span>
    <b>我选私有 →</b>
  </a>
</div>

{% if site.github.repository_url %}<div class="template-launch"><div><strong>已经选好模式？</strong><br><span>接下来打开模板，在创建页按上面的决定选择 Public 或 Private。</span></div><a class="primary-button" href="{{ site.github.repository_url }}" data-template-repository="{{ site.github.repository_nwo | escape }}" target="_blank" rel="noopener noreferrer">打开模板创建页 ↗</a></div>{% endif %}

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
      <li>第一次可以只填写<strong>面试题目</strong>；日期会自动使用本地当天，答案可以稍后补。</li>
      <li>只想自己保存：保持“在阅读网站显示这道题”关闭。想先公开问题：打开它，并让“答案状态”保持<strong>待解答</strong>。</li>
      <li>点击 <strong>Save</strong>（手机端是软盘图标）。待解答题只显示问题，不展示半成品，也不会进入模拟面试。</li>
      <li>答案完成后，把分类和难度改为正式值、复习状态改为“待复习”或“已掌握”，再把答案状态改成<strong>已完成</strong>并保存。</li>
    </ol>
    <p class="guide-note"><strong>注意：</strong>未发布只代表不在阅读网站显示。Public 仓库中的草稿源文件仍然公开；Private 只适合普通个人非公开笔记。公司机密、未授权题库或受 NDA 约束的内容不要上传到 GitHub。</p>
  </div>
  <figure class="guide-figure">
    <a href="{{ '/assets/guides/05-add-question.svg' | relative_url }}" target="_blank" rel="noopener noreferrer" aria-label="放大查看 Pages CMS 只发布待解答问题示意图（在新窗口打开）"><img src="{{ '/assets/guides/05-add-question.svg' | relative_url }}" loading="lazy" alt="Pages CMS 打开网站显示开关、让答案保持待解答并点击 Save 的表单示意图"></a>
    <figcaption>图 5：先记题目就能保存；发布开关控制题目是否可见，答案状态控制题解是否展示。点击查看大图。</figcaption>
  </figure>
</div>

<figure class="guide-figure guide-wide">
  <a href="{{ '/assets/guides/06-deploy-success.svg' | relative_url }}" target="_blank" rel="noopener noreferrer" aria-label="放大查看 GitHub Actions 成功状态示意图（在新窗口打开）"><img src="{{ '/assets/guides/06-deploy-success.svg' | relative_url }}" loading="lazy" alt="GitHub Actions 内容校验、构建和部署成功示意图"></a>
  <figcaption>图 6：公开模式会继续部署网页；私有模式只校验并保存内容。点击查看大图。</figcaption>
</figure>

<section class="capture-panel">
  <span class="status-badge">配置完成后</span>
  <h2>以后按需要走三条日常路径</h2>
  <p><strong>只发布问题：</strong>打开发布开关，答案保持待解答。<strong>只给自己速记：</strong>关闭发布开关。<strong>准备复习：</strong>从答案已完成的题目中随机抽题。</p>
  <a class="primary-button" href="{{ '/manage/' | relative_url }}#question-only-workflow">查看只发布问题流程</a>
  <a class="secondary-button" href="{{ '/practice/' | relative_url }}">开始模拟面试</a>
</section>

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
- **保存时提示错误**：确认所有 Required 字段都已填写；题目至少 2 个字符。
- **为什么草稿也能在 GitHub 看到**：发布开关只控制阅读网站。仓库是 Public 时，所有源文件都公开；真正需要私密请使用 Private 仓库。
- **公开题库保存后网页没更新**：打开 GitHub Actions，查看校验或部署是否出现红色错误。
- **私有题库没有阅读网址**：这是预期行为，请直接收藏 [Pages CMS](https://app.pagescms.org/) 作为编辑入口。
- **组织账号没有某个按钮**：可能被组织策略限制，需要组织管理员批准。

</div>
