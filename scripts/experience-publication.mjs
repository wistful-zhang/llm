const ALLOWED_FIELDS = new Set([
  'title',
  'published',
  'consent_to_publish',
  'company_alias',
  'role',
  'interview_month',
  'round_summary',
  'tags',
]);

const BOOLEAN_FIELDS = new Set(['published', 'consent_to_publish']);

const namedEntities = new Map([
  ['amp', '&'],
  ['apos', "'"],
  ['colon', ':'],
  ['commat', '@'],
  ['gt', '>'],
  ['hyphen', '-'],
  ['lt', '<'],
  ['num', '#'],
  ['period', '.'],
  ['quot', '"'],
  ['sol', '/'],
]);

const decodeHtmlEntitiesOnce = (value) => String(value || '')
  .replace(/&#(x[0-9a-f]+|\d+);/gi, (match, token) => {
    const radix = token[0].toLowerCase() === 'x' ? 16 : 10;
    const digits = radix === 16 ? token.slice(1) : token;
    const codePoint = Number.parseInt(digits, radix);
    if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return match;
    return String.fromCodePoint(codePoint);
  })
  .replace(/&([a-z]+);/gi, (match, name) => namedEntities.get(name.toLowerCase()) || match);

const decodeHtmlEntities = (value) => {
  let decoded = String(value || '');
  for (let pass = 0; pass < 2; pass += 1) decoded = decodeHtmlEntitiesOnce(decoded);
  return decoded;
};

const decodePercentEncoding = (value) => {
  let decoded = String(value || '');
  for (let pass = 0; pass < 2; pass += 1) {
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      break;
    }
  }
  return decoded;
};

const renderedLikeText = (value) => decodeHtmlEntities(value)
  .normalize('NFKC')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/<\/?[A-Za-z][^>]*>/g, '')
  .replace(/(?:\*{1,3}|_{1,3}|~{2}|\x60+)/g, '')
  .replace(/\\(?=\S)/g, '')
  .replace(/\p{Default_Ignorable_Code_Point}/gu, '');

const sensitivePatterns = [
  {
    pattern: /(?:^|[^\d])1[3-9](?:[\s().\-–—_*~\x60\u200b-\u200d]*\d){9}(?!\d)/,
    label: '疑似手机号码',
  },
  {
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    label: '疑似邮箱地址',
  },
  {
    pattern: /https?:\/\/(?:[A-Z0-9-]+\.)*(?:zoom\.us|meet\.google\.com|webex\.com|teams\.microsoft\.com|teams\.microsoft\.us|meeting\.tencent\.com|voovmeeting\.com|feishu\.cn|larksuite\.com|dingtalk\.com|skype\.com|whereby\.com|meet\.jit\.si|gotomeeting\.com|goto\.com|bluejeans\.com|ringcentral\.com)(?=[:/?#\s]|$)/i,
    label: '疑似会议链接',
  },
];

export const findSensitivePublicContent = (...values) => {
  const candidates = values.flat(Infinity).flatMap((value) => {
    const decoded = decodeHtmlEntities(value).normalize('NFKC');
    const percentDecoded = decodePercentEncoding(decoded);
    return [decoded, renderedLikeText(decoded), percentDecoded, renderedLikeText(percentDecoded)];
  });
  return sensitivePatterns
    .filter(({ pattern }) => candidates.some((candidate) => pattern.test(candidate)))
    .map(({ label }) => label);
};

const parseSafeScalar = (rawValue, fieldName, lineNumber, filename, errors) => {
  const raw = String(rawValue || '').trim();
  const prefix = filename + ': frontmatter 第 ' + lineNumber + ' 行字段 ' + fieldName;
  if (!raw) return '';

  if (raw.includes('\\')) {
    errors.push(prefix + ' 不允许使用转义字符，请直接填写可见文本');
    return raw;
  }

  if (raw.startsWith('"')) {
    if (!raw.endsWith('"')) {
      errors.push(prefix + ' 的双引号没有闭合');
      return raw;
    }
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'string') throw new TypeError('not a string');
      return parsed;
    } catch {
      errors.push(prefix + ' 不是安全的单行字符串');
      return raw;
    }
  }

  if (raw.startsWith("'")) {
    if (!/^'(?:[^']|'')*'$/.test(raw)) {
      errors.push(prefix + ' 的单引号没有按 YAML 规则闭合');
      return raw;
    }
    return raw.slice(1, -1).replace(/''/g, "'");
  }

  if (/^(?:[!&*?|>@%\x60{}\[\],]|-[ \t])/.test(raw) ||
      /[\[\]{}&*!|<>#]/.test(raw) ||
      /:[ \t]/.test(raw)) {
    errors.push(prefix + ' 使用了不支持的复杂 YAML 语法，请改为普通单行文字');
  }
  return raw;
};

const parseTagList = (rawValue, lineNumber, filename, errors) => {
  const raw = String(rawValue || '').trim();
  if (raw === '[]') return [];
  if (!raw.startsWith('[') || !raw.endsWith(']')) {
    errors.push(filename + ': frontmatter 第 ' + lineNumber + ' 行的 tags 必须使用列表，不能使用折叠标量、别名或对象');
    return [];
  }
  const inner = raw.slice(1, -1).trim();
  if (!inner) return [];
  return inner.split(',').map((item) => parseSafeScalar(item, 'tags', lineNumber, filename, errors));
};

const parseSafeFrontmatter = (frontmatter, filename) => {
  const errors = [];
  const values = new Map();
  const duplicates = new Set();
  let activeList = '';

  String(frontmatter || '').split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1;
    if (/^\s*(?:#|$)/.test(line)) return;

    if (/^\s/.test(line)) {
      const listItem = /^ {2,}-[ \t]+(.+?)\s*$/.exec(line);
      if (activeList === 'tags' && listItem) {
        const tags = values.get('tags') || [];
        tags.push(parseSafeScalar(listItem[1], 'tags', lineNumber, filename, errors));
        values.set('tags', tags);
      } else {
        errors.push(filename + ': frontmatter 第 ' + lineNumber + ' 行使用了折叠标量、嵌套对象或非法缩进，公开面经只支持安全的单行字段');
      }
      return;
    }

    activeList = '';
    const match = /^([A-Za-z_][A-Za-z0-9_-]*):(?:[ \t]*(.*))?$/.exec(line);
    if (!match) {
      errors.push(filename + ': frontmatter 第 ' + lineNumber + ' 行使用了不支持的复杂 YAML 键');
      return;
    }

    const key = match[1];
    const rawValue = match[2] || '';
    if (!ALLOWED_FIELDS.has(key)) {
      errors.push(filename + ': frontmatter 字段 ' + key + ' 不允许用于公开面经；布局和网址由站点固定控制');
      return;
    }
    if (values.has(key)) duplicates.add(key);

    if (key === 'tags') {
      if (!rawValue.trim()) {
        values.set(key, []);
        activeList = key;
      } else {
        values.set(key, parseTagList(rawValue, lineNumber, filename, errors));
      }
      return;
    }

    if (BOOLEAN_FIELDS.has(key)) {
      if (rawValue === 'true') values.set(key, true);
      else if (rawValue === 'false') values.set(key, false);
      else {
        errors.push(filename + ': ' + key + ' 必须是未加引号的 YAML 布尔值 true 或 false');
        values.set(key, null);
      }
      return;
    }

    values.set(key, parseSafeScalar(rawValue, key, lineNumber, filename, errors));
  });

  duplicates.forEach((name) => {
    errors.push(filename + ': frontmatter 字段 ' + name + ' 重复，已拒绝发布以避免可见性歧义');
  });
  return { values, errors };
};

const validMonth = (value) => /^\d{4}-(?:0[1-9]|1[0-2])$/.test(value);

export const isExperienceDocumentPath = (value) => /\.(?:md|markdown)$/i.test(String(value || ''));

export const hasPublishedExperienceFrontmatter = (source) => {
  const normalized = String(source || '').replace(/^\uFEFF/, '');
  const frontmatter = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] || '';
  return /^published:[ \t]*true[ \t]*\r?$/m.test(frontmatter);
};

const renderedExperienceArticle = (html) => {
  const match = String(html || '').match(
    /<article\b(?=[^>]*\bdata-public-experience=(?:"true"|'true'))[^>]*>[\s\S]*?<\/article>/i,
  );
  return match ? match[0] : '';
};

export const hasRenderedExperienceMarker = (html) => Boolean(renderedExperienceArticle(html));

export function validateRenderedExperienceHtml(html, filename = 'index.html') {
  const article = renderedExperienceArticle(html);
  if (!article) return [];
  return findSensitivePublicContent(article, filename)
    .map((label) => filename + ': 渲染后的公开面经包含' + label + '，请先删除或匿名处理');
}

export function validateExperienceDocument(source, filename = 'experience.md') {
  const errors = [];
  const normalized = String(source || '').replace(/^\uFEFF/, '');
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) return [filename + ': 缺少有效的 YAML frontmatter'];

  const frontmatter = match[1];
  const body = match[2];
  const parsed = parseSafeFrontmatter(frontmatter, filename);
  errors.push(...parsed.errors);

  const value = (name) => String(parsed.values.get(name) || '');
  const title = value('title');
  const companyAlias = value('company_alias');
  const role = value('role');
  const interviewMonth = value('interview_month');
  const roundSummary = value('round_summary');
  const tags = Array.isArray(parsed.values.get('tags')) ? parsed.values.get('tags') : [];
  const isPublished = parsed.values.get('published') === true;
  const consent = parsed.values.get('consent_to_publish');

  if (title.length < 2 || title.length > 120) errors.push(filename + ': title 长度应为 2～120 个字符');
  if (companyAlias.length < 2 || companyAlias.length > 40) errors.push(filename + ': company_alias 长度应为 2～40 个字符');
  if (role.length < 2 || role.length > 80) errors.push(filename + ': role 长度应为 2～80 个字符');
  if (!validMonth(interviewMonth)) errors.push(filename + ': interview_month 必须是有效的 YYYY-MM 月份');
  if (roundSummary.length > 120) errors.push(filename + ': round_summary 不能超过 120 个字符');
  if (parsed.values.get('published') === undefined) errors.push(filename + ': published 必须是未加引号的 YAML 布尔值 true 或 false');
  if (consent === undefined) errors.push(filename + ': consent_to_publish 必须是未加引号的 YAML 布尔值 true 或 false');
  if (tags.length > 12) errors.push(filename + ': tags 最多填写 12 个');
  tags.forEach((tag) => {
    if (!tag || tag.length > 40) errors.push(filename + ': 每个 tag 应为 1～40 个字符');
  });
  findSensitivePublicContent(filename)
    .forEach((label) => errors.push(filename + ': 文件名或路径包含' + label + '，请先改为匿名名称'));

  if (isPublished && consent !== true) {
    errors.push(filename + ': 公开面经前必须确认 consent_to_publish: true');
  }
  if (isPublished && renderedLikeText(body).replace(/\s+/g, ' ').trim().length < 80) {
    errors.push(filename + ': 公开面经正文至少需要 80 个有效字符');
  }
  if (isPublished && /\{[{%]/.test(body)) {
    errors.push(filename + ': 公开面经正文不允许使用 Liquid 模板语法');
  }
  if (isPublished && /<\/?[A-Za-z][^>]*>/.test(body)) {
    errors.push(filename + ': 公开面经正文不允许使用原始 HTML，请使用普通 Markdown');
  }
  if (isPublished && /!\[/.test(body)) {
    errors.push(filename + ': 公开面经不允许嵌入图片或截图，因为自动校验无法确认图片中是否包含隐私信息');
  }
  if (isPublished) {
    findSensitivePublicContent(title, companyAlias, role, roundSummary, tags, body)
      .forEach((label) => errors.push(filename + ': 公开内容包含' + label + '，请先删除或匿名处理'));
  }

  return errors;
}
