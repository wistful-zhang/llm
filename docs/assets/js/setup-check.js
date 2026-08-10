const root = document.querySelector('[data-setup-check]');

if (root) {
  const form = root.querySelector('[data-setup-check-form]');
  const input = root.querySelector('[data-setup-repository]');
  const submit = root.querySelector('[data-setup-submit]');
  const results = root.querySelector('[data-setup-results]');
  const title = root.querySelector('[data-setup-title]');
  const overall = root.querySelector('[data-setup-overall]');
  const grid = root.querySelector('[data-setup-grid]');
  const actions = root.querySelector('[data-setup-actions]');
  const message = root.querySelector('[data-setup-message]');
  const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
  const commentsEnabled = root.dataset.commentsEnabled === 'true';
  const commentsApiUrl = (root.dataset.commentsApi || '').trim();
  const questionsApiUrl = (root.dataset.questionsApi || '').trim();

  const makeElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const addCard = (label, value, state, hint) => {
    const card = makeElement('article', `setup-check-card setup-check-${state}`);
    card.append(
      makeElement('span', 'setup-check-card-label', label),
      makeElement('strong', '', value),
      makeElement('p', '', hint),
    );
    grid.append(card);
  };

  const addAction = (label, href, primary = false) => {
    const link = makeElement('a', primary ? 'primary-button' : 'secondary-button', label);
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    actions.append(link);
  };

  const runStatus = (run) => {
    if (!run) return { value: '还没有发布运行', state: 'warning', hint: '先在默认分支的 Actions 中手动运行一次工作流。Pull Request 检查不算网站发布。' };
    if (run.status !== 'completed') return { value: '正在运行', state: 'pending', hint: '等待运行结束后再刷新检查。' };
    if (run.conclusion === 'success') return { value: '最近一次成功', state: 'success', hint: `分支：${run.head_branch || '未知'} · ${new Date(run.updated_at || run.created_at).toLocaleString('zh-CN')}` };
    return { value: `最近一次${run.conclusion || '未完成'}`, state: 'error', hint: '打开运行详情，查看最后一个红色步骤的中文错误。' };
  };

  const safeHttpUrl = (value) => {
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  };

  const inspectComments = async () => {
    if (!commentsEnabled) return {
      value: '已经关闭',
      state: 'success',
      hint: '站点设置没有显示公开评论，因此不需要连接评论服务。',
      healthy: true,
    };
    if (!commentsApiUrl) return {
      value: '尚未开通',
      state: 'warning',
      hint: '网站不会连接 GitHub 评论。按“开通站内评论”部署自己的 Worker 后，访客即可免登录留言。',
      healthy: false,
    };

    let api;
    try {
      api = new URL(commentsApiUrl);
      if (api.protocol !== 'https:' || api.username || api.password || api.search || api.hash) throw new Error();
    } catch {
      return { value: '网址无效', state: 'error', hint: 'COMMENTS_API_URL 必须是 Worker 的 HTTPS 根网址。', healthy: false };
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(`${api.href.replace(/\/+$/, '')}/v1/config`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const config = await response.json();
      if (!config?.siteId || (config.writeEnabled !== false && !config?.turnstileSiteKey)) {
        throw new Error('配置字段不完整');
      }
      return {
        value: config.writeEnabled === false ? '只读可用' : '读取和留言可用',
        state: 'success',
        hint: config.writeEnabled === false ? '可以查看已有评论；Worker 当前关闭了新留言。' : '访客可以在题目下方直接查看和发表公开评论。',
        healthy: true,
        adminUrl: `${api.href.replace(/\/+$/, '')}/admin`,
      };
    } catch (error) {
      return {
        value: '连接失败',
        state: 'error',
        hint: error?.name === 'AbortError' ? '评论服务响应超时，请检查 Worker 状态和 SITE_URL。' : `请检查 Worker 变量、部署状态与 CORS（${error?.message || '未知错误'}）。`,
        healthy: false,
      };
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const inspectQuestions = async () => {
    if (!questionsApiUrl) return {
      value: '尚未开通',
      state: 'warning',
      hint: '私人题仍可使用；要让公开题站内直发，请配置 QUESTIONS_API_URL。',
      healthy: false,
    };

    let api;
    try {
      api = new URL(questionsApiUrl);
      if (api.protocol !== 'https:' || api.username || api.password || api.search || api.hash) throw new Error();
    } catch {
      return { value: '网址无效', state: 'error', hint: 'QUESTIONS_API_URL 必须是共享服务的 HTTPS 根网址。', healthy: false };
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(`${api.href.replace(/\/+$/, '')}/v1/config`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const config = await response.json();
      const writeEnabled = config?.questionsWriteEnabled ?? config?.writeEnabled;
      if (!config?.siteId || !config?.turnstileSiteKey || writeEnabled !== true) throw new Error('公开题写入配置不完整');
      const questionsResponse = await fetch(`${api.href.replace(/\/+$/, '')}/v1/questions?cursor=0&limit=1`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!questionsResponse.ok) throw new Error(`公开题读取接口 HTTP ${questionsResponse.status}`);
      const questionsPage = await questionsResponse.json();
      if (!Array.isArray(questionsPage?.questions)) throw new Error('公开题读取接口返回格式不完整');
      return {
        value: '站内直发可用',
        state: 'success',
        hint: '访客选择“公开”并保存后会立即进入共享题库，所有人都能看到。',
        healthy: true,
        adminUrl: `${api.href.replace(/\/+$/, '')}/admin`,
      };
    } catch (error) {
      return {
        value: '连接失败',
        state: 'error',
        hint: error?.name === 'AbortError' ? '共享题目服务响应超时，请检查 Worker 状态和 SITE_URL。' : `请检查 Worker、D1、Turnstile 与 CORS（${error?.message || '未知错误'}）。`,
        healthy: false,
      };
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const inspect = async (repository) => {
    results.hidden = false;
    grid.replaceChildren();
    actions.replaceChildren();
    overall.textContent = '检查中';
    overall.className = 'status-badge';
    title.textContent = repository;
    message.textContent = '正在读取 GitHub 的公开仓库状态…';
    submit.disabled = true;

    try {
      const encoded = repository.split('/').map(encodeURIComponent).join('/');
      const repoResponse = await fetch(`https://api.github.com/repos/${encoded}`, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (repoResponse.status === 404) throw new Error('没有找到这个公开仓库。请检查拼写；Private 仓库不能使用无 Token 自检。');
      if (repoResponse.status === 403) throw new Error('GitHub 公开 API 暂时限流，请稍后重试，或直接进入仓库 Actions 查看。');
      if (!repoResponse.ok) throw new Error(`GitHub 暂时无法返回仓库状态（${repoResponse.status}）。`);

      const repo = await repoResponse.json();
      const [commentsStatus, questionsStatus] = await Promise.all([inspectComments(), inspectQuestions()]);
      const workflowUrl = `https://api.github.com/repos/${encoded}/actions/workflows/pages.yml/runs?per_page=10&branch=${encodeURIComponent(repo.default_branch)}`;
      const workflowResponse = await fetch(workflowUrl, { headers: { Accept: 'application/vnd.github+json' } });
      let workflowLookupError = '';
      let latestRun = null;

      if (workflowResponse.ok) {
        const workflowData = await workflowResponse.json();
        latestRun = (workflowData.workflow_runs || []).find((run) => (
          run.head_branch === repo.default_branch
          && ['push', 'workflow_dispatch'].includes(run.event)
        )) || null;
      } else if (workflowResponse.status === 403) {
        workflowLookupError = 'GitHub API 已限流或拒绝读取 Actions。请稍后重试，或直接打开 Actions 查看。';
      } else if (workflowResponse.status === 404) {
        workflowLookupError = '默认分支中没有找到 pages.yml 工作流，或 Actions 尚未启用。';
      } else {
        workflowLookupError = `GitHub 暂时无法返回 Actions 状态（${workflowResponse.status}）。`;
      }

      addCard('仓库可见性', repo.visibility === 'public' ? 'Public' : repo.visibility, repo.visibility === 'public' ? 'success' : 'warning', repo.visibility === 'public' ? '公开题库可以启用 GitHub Pages。' : 'Private 仓库不要启用公开 Pages。');
      addCard('默认分支', repo.default_branch || '未知', 'success', '保存和首次手动发布时应选择这个分支。');
      addCard('GitHub Pages', repo.has_pages ? '已经启用' : '尚未启用', repo.has_pages ? 'success' : 'error', repo.has_pages ? 'Pages 已有配置；继续检查最近一次运行。' : '到 Settings → Pages，把 Source 设为 GitHub Actions。');
      addCard('公开增加题目', questionsStatus.value, questionsStatus.state, questionsStatus.hint);
      addCard('题目下方站内评论', commentsStatus.value, commentsStatus.state, commentsStatus.hint);
      if (workflowLookupError) {
        addCard('最近一次发布', '状态读取失败', 'error', workflowLookupError);
      } else {
        const latest = runStatus(latestRun);
        addCard('最近一次发布', latest.value, latest.state, latest.hint);
      }

      const healthy = repo.visibility === 'public'
        && repo.has_pages
        && questionsStatus.healthy
        && commentsStatus.healthy
        && !workflowLookupError
        && latestRun?.conclusion === 'success';
      overall.textContent = healthy ? '配置正常' : '需要处理';
      overall.className = `status-badge ${healthy ? 'status-public' : 'status-private'}`;
      message.textContent = healthy ? '公开仓库、Pages 和最近一次工作流都正常。' : '请按上面的提示处理，再重新检查。';

      addAction('打开仓库', repo.html_url, true);
      addAction('Pages 设置', `${repo.html_url}/settings/pages`);
      if (questionsStatus.adminUrl) addAction('管理公开题', questionsStatus.adminUrl);
      else addAction('开通共享题目服务', new URL('../questions/setup/', window.location.href).href);
      if (commentsStatus.adminUrl) addAction('管理站内评论', commentsStatus.adminUrl);
      else if (commentsEnabled) addAction('开通站内评论', new URL('../comments/setup/', window.location.href).href);
      addAction('Actions 运行记录', `${repo.html_url}/actions/workflows/pages.yml`);
      if (latestRun?.html_url) addAction('打开最近一次运行', latestRun.html_url);
      if (repo.has_pages) {
        const configuredWebsite = safeHttpUrl(repo.homepage);
        if (configuredWebsite) {
          addAction('打开仓库 Website', configuredWebsite);
        } else {
          const expected = repo.name.toLowerCase() === `${repo.owner.login.toLowerCase()}.github.io`
            ? `https://${repo.owner.login.toLowerCase()}.github.io/`
            : `https://${repo.owner.login.toLowerCase()}.github.io/${repo.name}/`;
          addAction('打开推测网站地址', expected);
        }
      }
      history.replaceState(null, '', `?repo=${encodeURIComponent(repo.full_name)}`);
    } catch (error) {
      overall.textContent = '无法检查';
      overall.className = 'status-badge status-private';
      message.textContent = error?.message || '检查失败，请稍后重试。';
      addCard('检查未完成', '没有读取到公开状态', 'error', message.textContent);
    } finally {
      submit.disabled = false;
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const repository = input.value.trim();
    if (!repositoryPattern.test(repository)) {
      input.setCustomValidity('请使用 owner/repository 格式，只填写 GitHub 账号和仓库名。');
      input.reportValidity();
      return;
    }
    input.setCustomValidity('');
    void inspect(repository);
  });
  input.addEventListener('input', () => input.setCustomValidity(''));

  const queryRepository = new URLSearchParams(window.location.search).get('repo');
  const initialRepository = repositoryPattern.test(queryRepository || '')
    ? queryRepository
    : root.dataset.defaultRepository;
  if (repositoryPattern.test(initialRepository || '')) input.value = initialRepository;
}
