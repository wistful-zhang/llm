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
      addCard('题目评论与公开补题', repo.has_issues ? 'Issues 已开启' : 'Issues 已关闭', repo.has_issues ? 'success' : 'error', repo.has_issues ? '每道题可以建立评论线程，使用者也能公开增加题目。' : '到 Settings → General → Features 开启 Issues，否则评论和公开增加题目不可用。');
      if (workflowLookupError) {
        addCard('最近一次发布', '状态读取失败', 'error', workflowLookupError);
      } else {
        const latest = runStatus(latestRun);
        addCard('最近一次发布', latest.value, latest.state, latest.hint);
      }

      const healthy = repo.visibility === 'public'
        && repo.has_pages
        && repo.has_issues
        && !workflowLookupError
        && latestRun?.conclusion === 'success';
      overall.textContent = healthy ? '配置正常' : '需要处理';
      overall.className = `status-badge ${healthy ? 'status-public' : 'status-private'}`;
      message.textContent = healthy ? '公开仓库、Pages 和最近一次工作流都正常。' : '请按上面的提示处理，再重新检查。';

      addAction('打开仓库', repo.html_url, true);
      addAction('Pages 设置', `${repo.html_url}/settings/pages`);
      addAction('Actions 运行记录', `${repo.html_url}/actions/workflows/pages.yml`);
      addAction('题目协作标签', `${repo.html_url}/actions/workflows/question-collaboration.yml`);
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
