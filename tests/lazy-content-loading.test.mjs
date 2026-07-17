import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('首页首屏只内嵌题目元数据，答案通过同源索引按需搜索', async () => {
  const [page, script, index] = await Promise.all([
    read('../docs/index.html'),
    read('../docs/assets/js/search.js'),
    read('../docs/search-index.json'),
  ]);

  const card = page.match(/<a class="question-card"[\s\S]*?<\/a>/)?.[0] || '';
  assert.match(page, /data-search-index-url=/);
  assert.match(card, /data-search-id=/);
  assert.doesNotMatch(card, /search_body|question\.content/);
  assert.match(index, /layout: null/);
  assert.match(index, /question\.content/);
  assert.match(script, /fetch\(indexUrl/);
  assert.match(script, /metadata\.includes\(keyword\) \|\| answer\.includes\(keyword\)/);
});

test('模拟面试首屏只内嵌元数据，并从题解页懒加载答案', async () => {
  const [page, script] = await Promise.all([
    read('../docs/practice.html'),
    read('../docs/assets/js/practice.js'),
  ]);

  const dataBlock = page.match(/<div id="practice-question-data"[\s\S]*?<\/div>/)?.[0] || '';
  assert.match(dataBlock, /data-question-id=/);
  assert.doesNotMatch(dataBlock, /question\.content|markdownify|<template/);
  assert.match(script, /fetch\(requestUrl\.href/);
  assert.match(script, /querySelector\('\.question-answer'\)/);
  assert.match(script, /answerCache/);
  assert.match(script, /重新加载参考回答/);
  assert.match(script, /跳过本题，继续/);
  assert.match(script, /直接自评后继续/);
});
