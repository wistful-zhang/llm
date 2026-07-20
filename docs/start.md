---
title: 新手使用指南
permalink: /start/
---

<div class="container prose standalone-page onboarding-page" markdown="1">

<div class="onboarding-intro" markdown="1">

<span class="status-badge">浏览器速记无需配置 · 发布自己的题库约 5～10 分钟</span>

# 建立自己的大模型面经

只想先记题或练习时，直接使用网站表单，不需要 GitHub 账号、后台或 Markdown。要把内容长期同步到自己的 GitHub、公开给别人看或多人维护时，再创建仓库、选择公开或私有，并连接 Pages CMS。

</div>

<nav class="journey-grid" aria-label="选择当前目标">
  <a class="journey-card" href="{{ '/capture/' | relative_url }}"><strong>我想马上记题</strong><span>普通文字填写，只保存到当前浏览器，答案可以留空。</span><b>打开快速记题 →</b></a>
  <a class="journey-card" href="{{ '/practice/' | relative_url }}"><strong>我只想先练习</strong><span>直接按分类随机抽题，不需要 GitHub 账号。</span><b>开始模拟面试 →</b></a>
  <a class="journey-card" href="{{ '/interviews/' | relative_url }}"><strong>我想记录真实面试</strong><span>不需要 GitHub 登录，记录只保存在自己的浏览器。</span><b>记录公司与进度 →</b></a>
  <a class="journey-card" href="#mode-choice"><strong>我是第一次创建</strong><span>继续下面 5 步，先决定公开还是私有。</span><b>开始首次配置 ↓</b></a>
</nav>

<div class="guide-alert" role="note" markdown="1">

**先记录、以后再创建自己的站点？** 快速记题和面试记录都按网站、仓库标识和浏览器分别保存。切换到自己的公开站点前，先分别导出两份 JSON，再到新站点恢复。Private 仓库不会部署这些浏览器页面；可以继续使用当前公开站点，或在自己的电脑上本地预览，但本机数据不会自动写入 Private 仓库。

</div>

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
    <span>只有本人和受邀者能查看仓库，适合保存原始速记；只在 CMS 编辑，不提供在线题库浏览或随机模拟。</span>
    <b>我选私有 →</b>
  </a>
</div>

{% if site.github.repository_url %}<div class="template-launch"><div><strong>已经选好模式？</strong><br><span>创建独立题库时使用基础模板，可以选择 Public 或 Private；如果要参与当前公开题库，用 Fork 保留当前内容并提交贡献。</span></div><div class="template-launch-actions"><a class="primary-button" href="{{ site.github.repository_url }}" data-template-repository="{{ site.github.repository_nwo | escape }}" target="_blank" rel="noopener noreferrer">打开 GitHub 仓库，再点 Use this template ↗</a><a class="secondary-button" href="{{ site.github.repository_url }}/fork" target="_blank" rel="noopener noreferrer">Fork 当前公开题库 ↗</a></div></div>{% endif %}

## 1. 从模板创建仓库

<div class="guide-step">
  <div class="guide-copy">
    <span class="step-number">1</span>
    <h3>打开模板</h3>
    <p>点击上方按钮进入 GitHub，然后选择 <strong>Use this template → Create a new repository</strong>。</p>
    <p class="guide-note"><strong>没有 Use this template？</strong> 优先点击仓库顶部的“generated from”来源；仓库主人也可以在 <strong>Settings → General</strong> 中开启 <strong>Template repository</strong>。</p>
    <p class="guide-note"><strong>模板和 Fork 的区别：</strong>模板用于建立完全独立的个人题库，可选择 Public 或 Private；Fork 会复制当前公开仓库并保留关联，适合投稿和跟进当前项目，但 Fork 仍是 Public。二次定制站点若没有开启 Template，基础模板按钮不会包含该站点后来新增的内容。</p>
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
      <li>进入 <strong>Actions → 内容检查与网站发布 → Run workflow</strong>，Branch 选择仓库默认分支（通常是 <code>main</code>），手动运行第一次部署。</li>
      <li>工作流变为绿色后，回到 <strong>Settings → Pages</strong> 点击 <strong>Visit site</strong>。</li>
    </ol>
    <figure class="guide-figure guide-wide">
      <a href="{{ '/assets/guides/03-enable-pages.svg' | relative_url }}" target="_blank" rel="noopener noreferrer" aria-label="放大查看 GitHub Pages 设置示意图（在新窗口打开）"><img src="{{ '/assets/guides/03-enable-pages.svg' | relative_url }}" loading="lazy" alt="GitHub Settings Pages 中选择 GitHub Actions 的操作示意图"></a>
      <figcaption>图 3：这张图只适用于公开题库。点击查看大图。</figcaption>
    </figure>
    <p class="mode-outcome">以后点击 Pages CMS 的 Save，内容会先写入 GitHub，随后自动校验；只有校验通过，公开网页才会更新。</p>
  </div>
</details>

<details id="private-flow" class="mode-details flow-private">
  <summary><span class="status-badge status-private">Private</span><strong>私有题库：跳过 Pages</strong><span class="summary-hint">展开步骤</span></summary>
  <div class="mode-details-body">
    <ol>
      <li><strong>不要启用 GitHub Pages</strong>，直接继续连接 Pages CMS。</li>
      <li>需要共同编辑时，在 GitHub 仓库中邀请协作者，并在 Pages CMS 中补充仓库授权。</li>
      <li>每次保存会先更新私有仓库，再执行内容校验，不会部署公开网页。</li>
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
    <p class="guide-note"><strong>第三方权限说明：</strong>Pages CMS 获得授权后可以读取和修改所选仓库，并缓存项目配置与内容。Private 仓库内容也会经过该服务。以后可在 GitHub 的 <strong>Settings → Applications → Installed GitHub Apps</strong> 中复查、缩小或撤销权限；不想授权时，也可以在 GitHub 网页中复制 <code>docs/_templates/question.md</code> 手动编辑。</p>
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
      <li>在 Pages CMS 的 <strong>Open a project</strong> 中打开仓库和默认分支（通常是 <code>main</code>）。</li>
      <li>进入“面试题与解答”，点击 <strong>Add an entry</strong>（手机端显示 <code>+</code>）。</li>
      <li>第一次可以只填写<strong>面试题目</strong>；日期会自动使用本地当天，答案可以稍后补。</li>
      <li>使用 Private 仓库个人保存，或在 Public 仓库暂不展示：保持“在阅读网站显示这道题”关闭。想先公开问题：最后再打开它，并让“答案状态”保持<strong>待解答</strong>。</li>
      <li>点击 <strong>Save</strong>（手机端是软盘图标）。待解答题只显示问题，不展示半成品，也不会进入模拟面试。</li>
      <li>答案完成后，把分类和难度改为正式值、复习状态改为“待复习”或“已掌握”，再把答案状态改成<strong>已完成</strong>并保存。</li>
    </ol>
    <p class="guide-note"><strong>使用 AI 补答案：</strong>Codex 打开你自己的题库仓库并拥有工作区写权限后，可以直接修改对应文件；要继续同步 GitHub，还必须已经完成 GitHub 身份验证，并对远端仓库有写权限。使用普通 AI，或任一条件不满足时，请先让 AI 生成答案，再把内容粘贴回 Pages CMS，手动修改答案状态并保存。</p>
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
  <h2>以后按需要走五条日常路径</h2>
  <p><strong>现场记题：</strong>在“＋记题”只填问题，先保存到当前浏览器。<strong>真实面试：</strong>记录公司、轮次、结果和复盘，需要分享时再做匿名检查。<strong>只发布问题：</strong>发布开关打开、答案保持待解答。<strong>个人仓库速记：</strong>使用 Private 仓库并关闭发布开关。<strong>准备复习：</strong>Public 题库可从答案已完成的题目中随机抽题。</p>
  <a class="primary-button" href="{{ '/capture/' | relative_url }}">直接在网页记题</a>
  <a class="secondary-button" href="{{ '/interviews/' | relative_url }}">记录一次真实面试</a>
  <a class="secondary-button" href="{{ '/experiences/manage/' | relative_url }}">查看匿名面经发布步骤</a>
  <a class="secondary-button" href="{{ '/manage/' | relative_url }}#question-only-workflow">查看记题流程</a>
  <a class="secondary-button" href="{{ '/practice/' | relative_url }}">开始模拟面试</a>
</section>

<div class="guide-alert" role="note" markdown="1">

**记录与公开是两件事。** 公司、轮次、结果和个人复盘默认只保存在当前浏览器。只有经过匿名化整理、确认不含隐私或受限内容，并且你明确打开发布开关的面经或题目，才应公开。即使关闭发布开关，Public 仓库中的源文件仍然可见。

</div>

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

<p><a class="primary-button" href="{{ '/setup-check/' | relative_url }}">打开公开仓库配置自检</a></p>

| 看到的状态 | 代表什么 | 下一步 |
| --- | --- | --- |
| Actions 没有任何运行 | 工作流未触发，或仓库禁用了 Actions | 确认选择了仓库默认分支，并在 Settings → Actions 中允许 Actions |
| 灰色 / Skipped | Private 模式正常跳过公开构建和部署 | 只要“检查内容”绿色即可；Private 本来就没有公开网站 |
| “检查内容”红色 | 文件已经保存到 GitHub，但本次没有发布 | 展开失败步骤，按日志最后的中文提示修改，然后再次 Save |
| “发布公开网站”红色 | Pages 设置或发布权限不正确 | 确认 Settings → Pages → Source 已选择 GitHub Actions |
| 全部绿色但网页暂时 404 | GitHub Pages 仍在生效，或打开的网址不完整 | 等几分钟，从 Settings → Pages 的 Visit site 进入 |
| 全部绿色但仍是旧内容 | 浏览器缓存，或看的不是最新一次运行 | 强制刷新，并确认最新运行对应刚才的提交 |

<div class="privacy-warning" markdown="1">

**如果误传了密码、Token 或密钥：**先立即去对应服务撤销或轮换，再处理 GitHub 历史。删除文件、关闭发布开关或新增修正提交，都不能让旧凭据重新安全，也不能自动清除 Git 历史。

</div>

- **Pages CMS 看不到仓库**：点击账号旁的齿轮或 **Manage GitHub App**，补选仓库并保存。
- **在“＋记题”保存后，为什么首页题数没有增加**：这里保存的是当前浏览器草稿，不是公开题库文件。整理好后，在题目卡片中下载 Markdown、复制给 Codex 发布，或复制投稿内容并打开 GitHub 表单。
- **保存时提示错误**：确认所有 Required 字段都已填写；题目至少 2 个字符。
- **为什么草稿也能在 GitHub 看到**：发布开关只控制阅读网站。仓库是 Public 时，所有源文件都公开；真正需要私密请使用 Private 仓库。
- **公开题库保存后网页没更新**：打开 GitHub Actions，查看校验或部署是否出现红色错误。
- **私有题库没有阅读网址或随机模拟**：这是当前模式的明确限制；请收藏 [Pages CMS](https://app.pagescms.org/) 作为编辑入口。在线浏览和模拟只能使用可公开的 Public 题库内容。
- **组织账号没有某个按钮**：可能被组织策略限制，需要组织管理员批准。
- **模板副本会自动收到更新吗**：不会。模板创建的是独立仓库；升级前请先阅读仓库中的 `UPGRADING.md`，保护自己的题目、公开面经和站点设置。
- **企业确实需要受控的 Private Pages**：先在企业策略下启用带访问控制的 Pages，再把仓库变量 `ALLOW_PRIVATE_PAGES_DEPLOYMENT` 设为 `true`。普通个人 Private 仓库不要设置该变量。

</div>
