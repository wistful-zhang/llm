import {
  buildQuestionDiscussionSearchApiUrl,
  normalizeQuestionDiscussion,
} from './question-collaboration-core.mjs';

const UTTERANCES_ORIGIN = 'https://utteranc.es';
const REPOSITORY_NWO_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]+$/;
const QUESTION_SLUG_PATTERN = /^[\p{L}\p{N}](?:[\p{L}\p{N}._-]{0,199})$/u;
const COMMENT_TERM_PATTERN = /^\[题目评论\] question:[\p{L}\p{N}](?:[\p{L}\p{N}._-]{0,199}) ·$/u;
const SESSION_STORAGE_KEY = 'llm-interview-utterances-session';

const readOAuthSession = () => {
  const pageUrl = new URL(window.location.href);
  const callbackSession = pageUrl.searchParams.get('utterances') || '';
  let storedSession = '';

  if (callbackSession) {
    pageUrl.searchParams.delete('utterances');
    window.history.replaceState(null, document.title, pageUrl.href);
    if (callbackSession.length <= 8192) {
      try {
        window.sessionStorage.setItem(SESSION_STORAGE_KEY, callbackSession);
      } catch {
        // The current callback can still complete when browser storage is unavailable.
      }
      return callbackSession;
    }
  }

  try {
    storedSession = window.sessionStorage.getItem(SESSION_STORAGE_KEY) || '';
  } catch {
    storedSession = '';
  }
  return storedSession.length <= 8192 ? storedSession : '';
};

const findLegacyIssueNumber = async (repositoryNwo, questionSlug) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(
      buildQuestionDiscussionSearchApiUrl(repositoryNwo, questionSlug),
      {
        headers: { Accept: 'application/vnd.github+json' },
        signal: controller.signal,
      },
    );
    if (!response.ok) return null;
    return normalizeQuestionDiscussion(
      await response.json(),
      repositoryNwo,
      questionSlug,
    )?.number || null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const createCommentFrame = ({ repositoryNwo, issueTerm, issueNumber, session }) => {
  const canonicalUrl = document.querySelector('link[rel="canonical"]')?.href
    || `${window.location.origin}${window.location.pathname}${window.location.search}`;
  const description = document.querySelector('meta[name="description"]')?.content || '';
  const encodedDescriptionLength = encodeURIComponent(description).length;
  const safeDescription = encodedDescriptionLength > 1000
    ? description.slice(0, Math.floor(description.length * 1000 / encodedDescriptionLength))
    : description;
  const openGraphTitle = document.querySelector('meta[property="og:title"],meta[name="og:title"]')?.content || '';
  const frameUrl = new URL('/utterances.html', UTTERANCES_ORIGIN);

  frameUrl.searchParams.set('repo', repositoryNwo);
  if (issueNumber) frameUrl.searchParams.set('issue-number', String(issueNumber));
  else frameUrl.searchParams.set('issue-term', issueTerm);
  frameUrl.searchParams.set('label', 'question-comments');
  frameUrl.searchParams.set('theme', 'github-light');
  frameUrl.searchParams.set('url', canonicalUrl);
  frameUrl.searchParams.set('origin', window.location.origin);
  frameUrl.searchParams.set('pathname', window.location.pathname.replace(/^\//, '').replace(/\.\w+$/, '') || 'index');
  frameUrl.searchParams.set('title', document.title);
  frameUrl.searchParams.set('description', safeDescription);
  frameUrl.searchParams.set('og:title', openGraphTitle);
  if (session) frameUrl.searchParams.set('session', session);

  const iframe = document.createElement('iframe');
  iframe.className = 'question-comments-frame';
  iframe.title = '题目评论';
  iframe.src = frameUrl.href;
  iframe.loading = 'lazy';
  iframe.scrolling = 'no';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  return iframe;
};

document.querySelectorAll('[data-question-comments]').forEach((root) => {
  const repositoryNwo = (root.dataset.repositoryNwo || '').trim();
  const questionSlug = (root.dataset.questionSlug || '').trim();
  const issueTerm = (root.dataset.commentIssueTerm || '').trim();
  const container = root.querySelector('[data-inline-comments]');
  const status = root.querySelector('[data-question-comments-status]');
  const fallback = root.querySelector('[data-question-comments-fallback]');

  const showFailure = (message) => {
    if (status) status.textContent = message;
    if (fallback) fallback.hidden = false;
  };

  if (!container
      || !REPOSITORY_NWO_PATTERN.test(repositoryNwo)
      || !QUESTION_SLUG_PATTERN.test(questionSlug)
      || !COMMENT_TERM_PATTERN.test(issueTerm)) {
    showFailure('评论框配置不完整，请使用下面的 GitHub 备用入口。');
    return;
  }

  const load = async () => {
    const session = readOAuthSession();
    const issueNumber = await findLegacyIssueNumber(repositoryNwo, questionSlug);
    const iframe = createCommentFrame({
      repositoryNwo,
      issueTerm,
      issueNumber,
      session,
    });

    const handleResize = (event) => {
      if (event.origin !== UTTERANCES_ORIGIN || event.source !== iframe.contentWindow) return;
      const height = Number(event.data?.height);
      if (event.data?.type !== 'resize' || !Number.isFinite(height) || height < 80 || height > 10000) return;
      container.style.height = `${Math.ceil(height)}px`;
      container.style.minHeight = '0';
    };

    window.addEventListener('message', handleResize);
    iframe.addEventListener('load', () => {
      if (status) status.hidden = true;
    }, { once: true });
    iframe.addEventListener('error', () => {
      window.removeEventListener('message', handleResize);
      showFailure('评论框加载失败，请使用下面的 GitHub 备用入口。');
    }, { once: true });
    container.replaceChildren(iframe);
  };

  void load();
});
