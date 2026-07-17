import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import {
  hasPublishedExperienceFrontmatter,
  hasRenderedExperienceMarker,
  validateRenderedExperienceHtml,
} from './experience-publication.mjs';
import {
  hasRenderedQuestionMarker,
  validateRenderedPublicArticleHtml,
} from './rendered-content-security.mjs';

const siteDir = resolve(process.argv[2] || '_site');
const experienceSourceDir = resolve(process.argv[3] || 'docs/_experiences');
const questionSourceDir = resolve(process.argv[4] || 'docs/_questions');
const errors = [];
let renderedExperienceCount = 0;
let expectedExperienceCount = 0;
let renderedQuestionCount = 0;
let expectedQuestionCount = 0;

const listHtmlFiles = (directory) => readdirSync(directory, { withFileTypes: true })
  .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
  .flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listHtmlFiles(path);
    return entry.isFile() && entry.name.toLowerCase().endsWith('.html') ? [path] : [];
  });

if (!existsSync(siteDir) || !statSync(siteDir).isDirectory()) {
  errors.push('找不到 Jekyll 构建目录：' + siteDir);
} else {
  listHtmlFiles(siteDir).forEach((path) => {
    const html = readFileSync(path, 'utf8');
    const filename = relative(siteDir, path);
    if (hasRenderedExperienceMarker(html)) {
      renderedExperienceCount += 1;
      errors.push(...validateRenderedExperienceHtml(html, filename));
      errors.push(...validateRenderedPublicArticleHtml(html, filename, 'data-public-experience'));
    }
    if (hasRenderedQuestionMarker(html)) {
      renderedQuestionCount += 1;
      errors.push(...validateRenderedPublicArticleHtml(html, filename, 'data-public-question'));
    }
  });
}

const countPublished = (directory, predicate) => readdirSync(directory, { withFileTypes: true })
    .reduce((count, entry) => {
      if (entry.name.startsWith('.')) return count;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return count + countPublished(path, predicate);
      if (!entry.isFile() || !/\.(?:md|markdown)$/i.test(entry.name)) return count;
      return count + (predicate(readFileSync(path, 'utf8')) ? 1 : 0);
    }, 0);

const hasPublishedQuestionFrontmatter = (source) => {
  const normalized = String(source || '').replace(/^\uFEFF/, '');
  const frontmatter = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] || '';
  return /^published:[ \t]*true[ \t]*\r?$/m.test(frontmatter);
};

if (!existsSync(experienceSourceDir) || !statSync(experienceSourceDir).isDirectory()) {
  errors.push('找不到公开面经源目录：' + experienceSourceDir);
} else {
  expectedExperienceCount = countPublished(experienceSourceDir, hasPublishedExperienceFrontmatter);
}

if (!existsSync(questionSourceDir) || !statSync(questionSourceDir).isDirectory()) {
  errors.push('找不到题目源目录：' + questionSourceDir);
} else {
  expectedQuestionCount = countPublished(questionSourceDir, hasPublishedQuestionFrontmatter);
}

if (renderedExperienceCount !== expectedExperienceCount) {
  errors.push(
    '公开面经源文件为 ' + expectedExperienceCount +
    ' 篇，但构建结果中找到 ' + renderedExperienceCount +
    ' 篇；请检查固定布局和发布状态',
  );
}

if (renderedQuestionCount !== expectedQuestionCount) {
  errors.push(
    '已发布题目源文件为 ' + expectedQuestionCount +
    ' 道，但构建结果中找到 ' + renderedQuestionCount +
    ' 道；请检查固定布局和发布状态',
  );
}

if (errors.length > 0) {
  console.error('渲染后公开内容校验失败（' + errors.length + ' 项）：');
  errors.forEach((error) => console.error('- ' + error));
  process.exitCode = 1;
} else {
  console.log(
    '渲染后公开内容校验通过：题目 ' + renderedQuestionCount +
    ' 道，公开面经 ' + renderedExperienceCount + ' 篇',
  );
}
