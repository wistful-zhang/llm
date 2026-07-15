import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  hasDirectorLanguage,
  hasValidSpokenAnswerLength,
  parseAnswerGuide,
} from './answer-guide-style.mjs';
import {
  ANSWER_STATUSES,
  getEffectiveAnswerStatus,
  hasCompleteAnswer,
  hasMeaningfulAnswer,
} from './publication-state.mjs';
import { validateMathFormatting } from './math-format.mjs';

const questionsDir = fileURLToPath(new URL('../docs/_questions/', import.meta.url));
const allowedDifficulties = new Set(['待评估', '简单', '中等', '困难']);
const publishableDifficulties = new Set(['简单', '中等', '困难']);
const allowedReviewStatuses = new Set(['待整理', '待复习', '已掌握']);
const requiredVerifiedSections = [
  '面试时怎么答',
  '核心回答',
  '展开说明',
  '工程实践',
  '常见追问',
  '一句话复习',
  '参考资料',
];
const seenTitles = new Map();
const seenNormalizedTitles = new Map();
const guidancePrefixOwners = new Map();
const errors = [];
let publishedCount = 0;
let verifiedCount = 0;
const questionsPathExists = existsSync(questionsDir);
const questionsPathIsDirectory = questionsPathExists && statSync(questionsDir).isDirectory();
const files = questionsPathIsDirectory
  ? readdirSync(questionsDir).filter((name) => name.endsWith('.md')).sort()
  : [];

if (questionsPathExists && !questionsPathIsDirectory) {
  errors.push('docs/_questions 必须是目录');
}

const unquote = (value) => {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const field = (frontmatter, name) => {
  const match = frontmatter.match(new RegExp(`^${name}:\\s*(.+?)\\s*$`, 'm'));
  return match ? unquote(match[1]) : '';
};

const rawField = (frontmatter, name) => {
  const match = frontmatter.match(new RegExp(`^${name}:\\s*(.+?)\\s*$`, 'm'));
  return match ? match[1].trim() : '';
};

const normalizeTitle = (value) => value
  .normalize('NFKC')
  .toLocaleLowerCase('zh-CN')
  .replace(/[\s\p{P}]+/gu, '');

for (const filename of files) {
  const source = readFileSync(join(questionsDir, filename), 'utf8').replace(/^\uFEFF/, '');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);

  if (!match) {
    errors.push(`${filename}: 缺少有效的 YAML frontmatter`);
    continue;
  }

  const [, frontmatter, body] = match;
  const title = field(frontmatter, 'title');
  const category = field(frontmatter, 'category');
  const difficulty = field(frontmatter, 'difficulty');
  const sourceNote = field(frontmatter, 'source');
  const reviewStatus = field(frontmatter, 'review_status');
  const published = rawField(frontmatter, 'published');
  const verified = rawField(frontmatter, 'verified');
  const answerStatus = field(frontmatter, 'answer_status');
  const date = field(frontmatter, 'date');
  const isPublished = published === 'true';
  const isVerified = verified === 'true';
  const effectiveAnswerStatus = getEffectiveAnswerStatus({ answerStatus, body });
  const hasAnswer = hasCompleteAnswer({ answerStatus, body });
  validateMathFormatting(body).forEach((message) => {
    errors.push(`${filename}: ${message}`);
  });
  if (isPublished) publishedCount += 1;
  if (isVerified) verifiedCount += 1;

  if (title.length < 2 || title.length > 160) {
    errors.push(`${filename}: title 长度应为 2～160 个字符`);
  }
  if (!category || category.length > 30) {
    errors.push(`${filename}: category 必填且不能超过 30 个字符`);
  }
  if (isPublished && hasAnswer && category === '待整理') {
    errors.push(`${filename}: 发布前必须把 category 从“待整理”改为正式分类`);
  }
  if (!allowedDifficulties.has(difficulty)) {
    errors.push(`${filename}: difficulty 必须是“待评估”“简单”“中等”或“困难”`);
  }
  if (isPublished && hasAnswer && !publishableDifficulties.has(difficulty)) {
    errors.push(`${filename}: 发布前必须把 difficulty 从“待评估”改为正式难度`);
  }
  if (sourceNote.length > 80) {
    errors.push(`${filename}: source 不能超过 80 个字符`);
  }
  if (answerStatus && effectiveAnswerStatus === null) {
    errors.push(`${filename}: answer_status 必须是“pending”或“complete”`);
  }
  if (effectiveAnswerStatus === ANSWER_STATUSES.complete && !hasMeaningfulAnswer(body)) {
    errors.push(`${filename}: answer_status 为 complete 时必须包含有效答案`);
  }
  if (isVerified && !isPublished) {
    errors.push(`${filename}: verified: true 只能用于已发布题目`);
  }
  if (isVerified && !hasAnswer) {
    errors.push(`${filename}: verified: true 只能用于答案状态为 complete 且正文有效的题目`);
  }
  if (verified && !['true', 'false'].includes(verified)) {
    errors.push(`${filename}: verified 必须是未加引号的 YAML 布尔值 true 或 false`);
  }
  if (isVerified && !sourceNote) {
    errors.push(`${filename}: 已核验题目必须填写 source，说明面经主题或题目来源`);
  }
  if (!allowedReviewStatuses.has(reviewStatus)) {
    errors.push(`${filename}: review_status 必须是“待整理”“待复习”或“已掌握”`);
  }
  if (isPublished && hasAnswer && reviewStatus === '待整理') {
    errors.push(`${filename}: 发布前必须把 review_status 从“待整理”改为“待复习”或“已掌握”`);
  }
  if (!['true', 'false'].includes(published)) {
    errors.push(`${filename}: published 必须是未加引号的 YAML 布尔值 true 或 false`);
  }
  const parsedDate = new Date(`${date}T00:00:00Z`);
  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(parsedDate.valueOf()) &&
    parsedDate.toISOString().slice(0, 10) === date;
  if (!isValidDate) {
    errors.push(`${filename}: date 必须是有效的 YYYY-MM-DD 日期`);
  }
  if (isVerified && hasAnswer) {
    requiredVerifiedSections.forEach((section) => {
      const heading = new RegExp(`^##\\s+${section}\\s*$`, 'm');
      if (!heading.test(body)) {
        errors.push(`${filename}: 已核验题目缺少“## ${section}”章节`);
      }
    });

    const answerGuideSection = (body.split(/^##\s+面试时怎么答\s*$/m)[1] || '')
      .split(/^##\s+/m)[0];
    const {
      markerCount,
      guidanceOnly,
      spokenSection,
      spokenAnswer,
      guidanceText,
    } = parseAnswerGuide(answerGuideSection);
    if (markerCount !== 1) {
      errors.push(`${filename}: “面试时怎么答”必须且只能包含一次“可以这样答”`);
    }
    if (!/^>\s+\S+/m.test(spokenSection)) {
      errors.push(`${filename}: “可以这样答”必须使用引用块给出可直接口述的答案`);
    }
    if (!hasValidSpokenAnswerLength(spokenAnswer)) {
      errors.push(`${filename}: 参考口述应控制在 80～240 个字符，当前为 ${spokenAnswer.length}`);
    }
    if (guidanceText.length < 60 || guidanceText.length > 700) {
      errors.push(`${filename}: 题目专属答题提示应控制在 60～700 个字符，当前为 ${guidanceText.length}`);
    }

    const guidanceParagraphs = guidanceOnly
      .split(/\r?\n\s*\r?\n/)
      .map((paragraph) => paragraph
        .replace(/^[\s>*#-]+/gm, '')
        .replace(/[`*_]/g, '')
        .replace(/\s+/g, ' ')
        .trim())
      .filter(Boolean);
    guidanceParagraphs.forEach((paragraph) => {
      const prefix = paragraph
        .normalize('NFKC')
        .toLocaleLowerCase('zh-CN')
        .replace(/[\s\p{P}]+/gu, '')
        .slice(0, 12);
      if (prefix.length < 12) return;
      const owners = guidancePrefixOwners.get(prefix) || new Set();
      owners.add(filename);
      guidancePrefixOwners.set(prefix, owners);
    });

    if (/[。！？；，][ \t]+\S/.test(answerGuideSection)) {
      errors.push(`${filename}: “面试时怎么答”包含中文标点后的多余空格`);
    }

    const mechanicalGuide = /建议按“结论 → 原理 → 取舍 → 落地”回答|^\d+\.\s+\*\*(?:先给结论|再讲关键机制|主动说取舍|最后落到项目)[：:]?\*\*/m;
    if (mechanicalGuide.test(answerGuideSection)) {
      errors.push(`${filename}: “面试时怎么答”仍在使用旧的固定四步模板，请按当前题型自然组织`);
    }
    if (hasDirectorLanguage(answerGuideSection, spokenAnswer)) {
      errors.push(`${filename}: “面试时怎么答”包含讲解脚本的元话术，请直接回答问题`);
    }

    const followupSection = (body.split(/^##\s+常见追问\s*$/m)[1] || '')
      .split(/^##\s+/m)[0];
    const answeredFollowups = followupSection.match(/^\d+\.\s+\*\*[^*]+\*\*(?:[：:]\s*|\s+)\S+/gm) || [];
    if (answeredFollowups.length < 3) {
      errors.push(`${filename}: “常见追问”至少需要 3 个“粗体问题 + 直接回答”`);
    }

    const referenceSection = body.split(/^##\s+参考资料\s*$/m)[1] || '';
    if (!/\[[^\]]+\]\(https:\/\/[^)]+\)/.test(referenceSection)) {
      errors.push(`${filename}: “参考资料”至少需要一条 HTTPS 可核验链接`);
    }
  }

  if (title && isPublished) {
    if (seenTitles.has(title)) {
      errors.push(`${filename}: 题目标题与 ${seenTitles.get(title)} 重复`);
    } else {
      seenTitles.set(title, filename);
    }

    const normalizedTitle = normalizeTitle(title);
    if (seenNormalizedTitles.has(normalizedTitle)) {
      errors.push(`${filename}: 题目标题与 ${seenNormalizedTitles.get(normalizedTitle)} 仅有大小写、空格或标点差异`);
    } else {
      seenNormalizedTitles.set(normalizedTitle, filename);
    }
  }
}

for (const [prefix, owners] of guidancePrefixOwners) {
  if (owners.size >= 3) {
    errors.push(`答题提示前缀“${prefix}…”在 ${owners.size} 道已核验题目中重复，请改成题目专属表达（${[...owners].slice(0, 5).join('、')}）`);
  }
}

if (errors.length > 0) {
  console.error(`内容校验失败（${errors.length} 项）：`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`内容校验通过：共 ${files.length} 道，已发布 ${publishedCount} 道，已核验 ${verifiedCount} 道，草稿 ${files.length - publishedCount} 道`);
}
