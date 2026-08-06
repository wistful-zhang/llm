---
title: 开通站内评论
description: 一次部署独立评论服务，让访客无需 GitHub 账号即可在题目下方留言。
permalink: /comments/setup/
---

<div class="container prose standalone-page comment-setup-page" data-comment-setup markdown="1">

<span class="status-badge">题库主人只配置一次 · 访客无需登录</span>

# 开通像论坛一样的站内评论

> 当前版本默认关闭题目评论。建立个人题库不需要完成本页配置；只有以后明确决定恢复并愿意维护独立服务时，再参考以下高级说明。

完成后，访客只需要填写昵称和内容，评论就会直接显示在当前题目下面。每道题有独立楼层，支持回复、举报和本机编辑 / 删除；正常评论立即公开，不进入“待审核”。

GitHub Pages 本身不能保存所有人共享的评论，所以本项目把评论服务独立部署到你的 Cloudflare 账号：Worker 负责接口，D1 保存评论，Turnstile 负责防刷。每个题库副本使用自己的数据库，不会连接原作者的数据。

## 第一步：创建无感人机验证

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，打开 **Turnstile → Add widget**。
2. Widget name 可以填写“题库评论”，模式选择 **Managed**。
3. Hostname 填写题库网站域名，例如 `your-name.github.io`；使用自定义域名时也要加入。
4. 创建后保存 **Site key** 和 **Secret key**。Site key 可以公开，Secret key 只能放在 Worker 的加密变量中。

## 第二步：一键部署评论服务

{% if site.github.repository_url %}
{% assign comments_worker_branch = site.github.source.branch | default: 'main' %}
{% capture comments_worker_repo_url %}{{ site.github.repository_url }}/tree/{{ comments_worker_branch }}/comments-worker{% endcapture %}
<a class="primary-button" href="https://deploy.workers.cloudflare.com/?url={{ comments_worker_repo_url | strip | url_encode }}" target="_blank" rel="noopener noreferrer">Deploy to Cloudflare ↗</a>
{% else %}
<a class="primary-button" href="https://developers.cloudflare.com/workers/platform/deploy-buttons/" target="_blank" rel="noopener noreferrer">查看 Cloudflare 部署说明 ↗</a>
{% endif %}

Cloudflare 会把仓库里的 `comments-worker` 当成独立项目，读取其中的 `wrangler.jsonc`，自动创建并绑定 D1 数据库。部署界面的命令保持项目给出的默认值，它会先执行数据库迁移，再发布 Worker。

部署完成后，进入这个 Worker 的 **Settings → Variables and Secrets**，填写：

| 名称 | 类型 | 填写内容 |
| --- | --- | --- |
| `SITE_URL` | Text | 题库完整网址，不带末尾 `/`，例如 `https://your-name.github.io/llm` |
| `SITE_ID` | Text | 下方生成的随机站点标识 |
| `TURNSTILE_SITE_KEY` | Text | 第一步得到的 Site key |
| `TURNSTILE_SECRET_KEY` | **Secret** | 第一步得到的 Secret key |
| `HASH_SECRET` | **Secret** | 下方生成的限流密钥 |
| `ADMIN_TOKEN` | **Secret** | 下方生成的管理员口令 |

<div class="comment-secret-generator" data-comment-secret-generator markdown="0">
  <p><strong>只在当前页面生成，不会上传或保存。</strong>复制后请放进 Cloudflare；页面关闭后无法找回。</p>
  <label><span>SITE_ID</span><input type="text" readonly data-generated-site-id><button class="secondary-button" type="button" data-copy-generated="site">复制</button></label>
  <label><span>HASH_SECRET</span><input type="text" readonly data-generated-hash-secret><button class="secondary-button" type="button" data-copy-generated="hash">复制</button></label>
  <label><span>ADMIN_TOKEN</span><input type="text" readonly data-generated-admin-token><button class="secondary-button" type="button" data-copy-generated="admin">复制</button></label>
  <button class="text-button" type="button" data-regenerate-comment-secrets>重新生成</button>
  <p data-comment-secret-status role="status" aria-live="polite"></p>
</div>

保存变量后，在 Worker 页面点击 **Deploy** 重新部署一次。打开 `你的 Worker 网址/v1/config`，看到 `siteId` 和 `turnstileSiteKey` 即表示后端已经就绪。

## 第三步：把网站连到 Worker

1. 复制 Cloudflare 给出的 Worker 根网址，例如 `https://llm-interview-comments.your-name.workers.dev`。
2. 进入 GitHub 仓库 **Settings → Secrets and variables → Actions → Variables**。
3. 新建变量 `COMMENTS_API_URL`，值只填写 Worker 根网址，不要附加 `/v1/config`、Token 或查询参数。
4. 打开 **Actions → 内容检查与网站发布 → Run workflow**。
5. 在 Pages CMS 的“站点设置”确认“在正式题目下方显示站内评论”已经开启。

构建时只会把公开的 Worker 网址写入网页。Turnstile Secret、限流密钥和管理员口令始终留在 Cloudflare，不会进入 GitHub、网页源码或 Pages CMS。

## 管理评论

打开 `你的 Worker 网址/admin`，输入 `ADMIN_TOKEN` 即可查看最近评论和举报，并执行隐藏、恢复、删除、导出，以及直接锁定或重新开放某道题的评论区。管理员口令只保存在当前标签页的 `sessionStorage`；不要把它发给访客，也不要填写到 GitHub 仓库变量中。

访客发布后会在本机保存该评论的随机修改凭据，因此可以在原题下编辑或删除自己的评论。清理浏览器数据或换设备后，这个能力会丢失，但仍可使用“举报”请管理员处理。

## 为什么不能完全省掉这次配置

纯静态网页没有公共数据库。把数据库密码或管理员 Token 写进前端，任何访客都能拿到并删除全部评论；只用浏览器本地存储，则别人根本看不到。这里的一次部署就是在“真正共享”和“安全”之间不可省略的边界。

</div>

<script type="module" src="{{ '/assets/js/comment-setup.js' | relative_url }}"></script>
