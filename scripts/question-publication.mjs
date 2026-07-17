import { validatePublicMarkdown } from './public-markup-security.mjs';

const ALLOWED_FIELDS = new Set([
  'title',
  'source',
  'verified',
  'category',
  'difficulty',
  'tags',
  'review_status',
  'published',
  'answer_status',
  'date',
]);

const BOOLEAN_FIELDS = new Set(['verified', 'published']);

const parseSafeScalar = (rawValue, fieldName, lineNumber, filename, errors) => {
  const raw = String(rawValue || '').trim();
  const prefix = `${filename}: frontmatter 第 ${lineNumber} 行字段 ${fieldName}`;
  if (!raw) return '';

  if (raw.includes('\\')) {
    errors.push(`${prefix} 不允许使用转义字符，请直接填写可见文本`);
    return raw;
  }

  if (raw.startsWith('"')) {
    if (!raw.endsWith('"')) {
      errors.push(`${prefix} 的双引号没有闭合`);
      return raw;
    }
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'string') throw new TypeError('not a string');
      return parsed;
    } catch {
      errors.push(`${prefix} 不是安全的单行字符串`);
      return raw;
    }
  }

  if (raw.startsWith("'")) {
    if (!/^'(?:[^']|'')*'$/.test(raw)) {
      errors.push(`${prefix} 的单引号没有按 YAML 规则闭合`);
      return raw;
    }
    return raw.slice(1, -1).replace(/''/g, "'");
  }

  if (/^(?:[!&*?|>@%`{},\[\]]|-[ \t])/.test(raw) ||
      /[\[\]{}&*!|<>#]/.test(raw) ||
      /:[ \t]/.test(raw)) {
    errors.push(`${prefix} 使用了不支持的复杂 YAML 语法，请改为普通单行文字`);
  }
  return raw;
};

const splitInlineList = (source, lineNumber, filename, errors) => {
  const items = [];
  let quote = '';
  let start = 0;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quote === "'" && character === "'" && source[index + 1] === "'") {
      index += 1;
      continue;
    }
    if ((character === '"' || character === "'") && (!quote || quote === character)) {
      quote = quote ? '' : character;
      continue;
    }
    if (character === ',' && !quote) {
      items.push(source.slice(start, index));
      start = index + 1;
    }
  }
  if (quote) errors.push(`${filename}: frontmatter 第 ${lineNumber} 行的 tags 引号没有闭合`);
  items.push(source.slice(start));
  return items;
};

const parseTagList = (rawValue, lineNumber, filename, errors) => {
  const raw = String(rawValue || '').trim();
  if (raw === '[]') return [];
  if (!raw.startsWith('[') || !raw.endsWith(']')) {
    errors.push(`${filename}: frontmatter 第 ${lineNumber} 行的 tags 必须使用列表，不能使用折叠标量、别名或对象`);
    return [];
  }
  const inner = raw.slice(1, -1).trim();
  if (!inner) return [];
  return splitInlineList(inner, lineNumber, filename, errors)
    .map((item) => parseSafeScalar(item, 'tags', lineNumber, filename, errors));
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
        errors.push(`${filename}: frontmatter 第 ${lineNumber} 行使用了折叠标量、嵌套对象或非法缩进，题目只支持安全的单行字段`);
      }
      return;
    }

    activeList = '';
    const match = /^([A-Za-z_][A-Za-z0-9_-]*):(?:[ \t]*(.*))?$/.exec(line);
    if (!match) {
      errors.push(`${filename}: frontmatter 第 ${lineNumber} 行使用了不支持的复杂 YAML 键`);
      return;
    }

    const key = match[1];
    const rawValue = match[2] || '';
    if (!ALLOWED_FIELDS.has(key)) {
      errors.push(`${filename}: frontmatter 字段 ${key} 不允许用于题目；布局和网址由站点固定控制`);
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
        errors.push(`${filename}: ${key} 必须是未加引号的 YAML 布尔值 true 或 false`);
        values.set(key, null);
      }
      return;
    }

    values.set(key, parseSafeScalar(rawValue, key, lineNumber, filename, errors));
  });

  duplicates.forEach((name) => {
    errors.push(`${filename}: frontmatter 字段 ${name} 重复，已拒绝发布以避免可见性歧义`);
  });
  return { values, errors };
};

export const isQuestionDocumentPath = (value) => /\.(?:md|markdown)$/i.test(String(value || ''));

/**
 * Parses the deliberately small frontmatter subset shared by validation and Jekyll.
 * Unknown/duplicate keys and YAML features with ambiguous parser semantics are rejected.
 */
export function parseQuestionDocument(source, filename = 'question.md') {
  const normalized = String(source || '').replace(/^\uFEFF/, '');
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) {
    return {
      body: '',
      errors: [`${filename}: 缺少有效的 YAML frontmatter`],
      hasFrontmatter: false,
      values: new Map(),
    };
  }

  const parsed = parseSafeFrontmatter(match[1], filename);
  const body = match[2];
  const errors = [...parsed.errors];
  if (parsed.values.get('published') === true) {
    errors.push(...validatePublicMarkdown(body, filename, '公开题目正文'));
  }
  return {
    body,
    errors,
    hasFrontmatter: true,
    values: parsed.values,
  };
}
