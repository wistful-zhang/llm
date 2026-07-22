---
title: 配置自检
description: 不填写 Token，检查公开题库的 GitHub Pages 和最近一次发布状态。
permalink: /setup-check/
---

<div class="container prose standalone-page setup-check-page" data-setup-check data-default-repository="{{ site.github.repository_nwo | escape }}" markdown="1">

<span class="status-badge">公开仓库 · 无需 Token</span>

# 检查题库为什么没有更新

输入公开仓库的 `账号/仓库名`，系统会读取 GitHub 的公开状态，检查可见性、默认分支、Pages、Issues 和最近一次发布。它不会登录 GitHub，也不会读取 Private 仓库、题目草稿或浏览器面试记录。

<form class="setup-check-form" data-setup-check-form>
  <label for="setup-repository"><strong>GitHub 仓库</strong><span>例如：your-name/llm-notes</span></label>
  <div class="setup-check-input-row">
    <input id="setup-repository" name="repository" type="text" inputmode="url" autocomplete="off" spellcheck="false" placeholder="owner/repository" pattern="[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+" required data-setup-repository>
    <button class="primary-button" type="submit" data-setup-submit>开始检查</button>
  </div>
</form>

<div class="guide-alert" role="note" markdown="1">

**不要在这里填写密码或 Token。** Private 仓库不会向未登录的自检页公开状态；请直接在自己的 GitHub 仓库中查看 Actions，并确认没有启用公开 Pages。

</div>

<section class="setup-check-results" aria-labelledby="setup-check-title" data-setup-results hidden>
  <div class="interview-section-heading">
    <div>
      <span class="section-kicker">检查结果</span>
      <h2 id="setup-check-title" tabindex="-1" data-setup-title>仓库状态</h2>
    </div>
    <span class="status-badge" data-setup-overall>检查中</span>
  </div>
  <div class="setup-check-grid" data-setup-grid></div>
  <div class="setup-check-actions" data-setup-actions></div>
</section>

<p class="setup-check-message" data-setup-message role="status" aria-live="polite"></p>

## 自检看不到 Private 仓库怎么办

这是有意的隐私限制。请进入自己的仓库：

1. 打开 **Actions → 内容检查与网站发布**。
2. 只要“检查内容”绿色即可；“构建公开网站”和“发布公开网站”显示 Skipped 属于正常情况。
3. Private 内容需要通过 Pages CMS 编辑时，只授权对应仓库；不要为了获得预览而开启公开 Pages。

<a class="secondary-button" href="{{ '/start/' | relative_url }}#mode-choice">返回完整新手指南</a>

</div>

<script type="module" src="{{ '/assets/js/setup-check.js' | relative_url }}"></script>
