import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_INTERVIEW_QUESTIONS_PER_ROUND,
  MAX_INTERVIEW_QUESTION_LENGTH,
  TRACKER_BACKUP_FORMAT,
  TRACKER_SCHEMA_VERSION,
  TrackerDataError,
  buildApplicationViews,
  buildPublicExperienceDraft,
  buildQuestionBatchDraft,
  createEmptyTracker,
  createTrackerBackup,
  escapeCsvCell,
  filterApplicationViews,
  listUpcomingItems,
  mergeTrackers,
  parseInterviewQuestions,
  parseTrackerBackup,
  removeApplication,
  removeRound,
  sanitizeTracker,
  summarizeTracker,
  trackerToCsv,
  updateApplication,
  upsertInterview,
} from '../docs/assets/js/interview-tracker-core.mjs';

const makeIds = () => {
  let value = 0;
  return () => String(++value);
};

const add = (tracker, values, idFactory, now = '2026-07-16T08:00:00.000Z') => upsertInterview(
  tracker,
  {
    company: '某科技公司',
    role: '大模型算法工程师',
    date: '2026-07-16',
    stage: 'first',
    outcome: 'waiting',
    mode: 'online',
    ...values,
  },
  { idFactory, now, repositoryId: 'owner/repo' },
);

test('v1 数据无损迁移到当前版本，并把既有流程设为仅当前浏览器', () => {
  const ids = makeIds();
  const current = add(createEmptyTracker('owner/repo'), {
    source: '内推',
    nextAction: '准备二面',
    nextActionOn: '2026-07-20',
    reflection: '保留这段复盘',
  }, ids);
  const legacy = structuredClone(current);
  legacy.schemaVersion = 1;
  delete legacy.applications[0].visibility;

  const migrated = sanitizeTracker(legacy, {
    repositoryId: 'owner/repo',
    now: '2026-07-16T09:00:00.000Z',
  });

  assert.equal(migrated.schemaVersion, TRACKER_SCHEMA_VERSION);
  assert.equal(migrated.applications[0].visibility, 'private');
  assert.equal(migrated.applications[0].source, '内推');
  assert.equal(migrated.applications[0].nextAction, '准备二面');
  assert.equal(migrated.applications[0].nextActionOn, '2026-07-20');
  assert.equal(migrated.rounds[0].reflection, '保留这段复盘');
  assert.deepEqual(migrated.companies, current.companies);
  assert.deepEqual(migrated.rounds, current.rounds);
});

test('老 v2 记录缺少被问题目字段时可无损升级为空列表', () => {
  const ids = makeIds();
  const legacy = add(createEmptyTracker('owner/repo'), { reflection: '老版本复盘' }, ids);
  legacy.schemaVersion = 2;
  delete legacy.rounds[0].questions;

  const migrated = sanitizeTracker(legacy, { repositoryId: 'owner/repo' });
  assert.equal(migrated.schemaVersion, TRACKER_SCHEMA_VERSION);
  assert.deepEqual(migrated.rounds[0].questions, []);
  assert.equal(migrated.rounds[0].reflection, '老版本复盘');
});

test('清洗数据遇到非法或重复实体会停止，显式诊断模式才允许检查可恢复部分', () => {
  const payload = createEmptyTracker('owner/repo');
  payload.companies = [
    { id: 'company_1', name: '甲公司' },
    { id: 'company_1', name: '重复公司' },
    null,
  ];
  payload.applications = [{ id: 'application_1', companyId: 'missing_company', role: '算法岗' }];

  assert.throws(
    () => sanitizeTracker(payload),
    (error) => error instanceof TrackerDataError
      && error.code === 'lossy_sanitization'
      && error.diagnostics.length === 3,
  );

  const diagnostics = [];
  const inspected = sanitizeTracker(payload, { strict: false, diagnostics });
  assert.equal(inspected.companies.length, 1);
  assert.equal(inspected.applications.length, 0);
  assert.deepEqual(diagnostics.map((item) => item.reason), [
    'duplicate_id',
    'invalid_entity',
    'missing_company',
  ]);
});

test('新流程默认仅当前浏览器，明确选择后可记录准备匿名分享', () => {
  const ids = makeIds();
  let tracker = add(createEmptyTracker('owner/repo'), {}, ids);
  assert.equal(tracker.applications[0].visibility, 'private');

  tracker = add(tracker, {
    company: '公开候选公司',
    role: '平台工程师',
    visibility: 'public',
  }, ids);
  assert.equal(tracker.applications[1].visibility, 'public');

  tracker = updateApplication(tracker, {
    applicationId: tracker.applications[0].id,
    company: '某科技公司',
    role: '大模型算法工程师',
    visibility: 'public',
  }, { idFactory: ids, repositoryId: 'owner/repo' });
  assert.equal(tracker.applications[0].visibility, 'public');
});

test('公开面经草稿只保留匿名流程概要，不带入私人字段', () => {
  const ids = makeIds();
  const tracker = add(createEmptyTracker('owner/repo'), {
    company: '真实公司机密名称',
    role: '大模型应用工程师',
    visibility: 'public',
    source: '张三内推',
    nextAction: '联系面试官李四',
    nextActionOn: '2026-07-18',
    reflection: '私人复盘：会议链接 https://example.com/secret',
    questions: '为什么 KV Cache 能加速推理？',
    rating: 2,
  }, ids);
  const [view] = buildApplicationViews(tracker);
  const draft = buildPublicExperienceDraft(view);

  assert.match(draft, /岗位方向：大模型应用工程师/);
  assert.match(draft, /技术一面：待反馈/);
  assert.doesNotMatch(draft, /KV Cache/);
  assert.doesNotMatch(draft, /真实公司机密名称|张三内推|李四|example\.com|2026-07-18|私人复盘/);

  const activeDraft = buildPublicExperienceDraft(view, { includeQuestions: true });
  assert.match(activeDraft, /被问题目（原始速记/);
  assert.match(activeDraft, /为什么 KV Cache 能加速推理/);
  assert.match(activeDraft, /系统没有判断其中是否包含公司身份/);
});

test('每轮被问题目按行保存、限制数量和长度，编辑时不会丢失', () => {
  const ids = makeIds();
  let tracker = add(createEmptyTracker('owner/repo'), {
    questions: '  为什么 KV Cache 能加速推理？  \n\nRAG 召回率怎样评估？',
  }, ids);
  assert.deepEqual(tracker.rounds[0].questions, [
    '为什么 KV Cache 能加速推理？',
    'RAG 召回率怎样评估？',
  ]);

  tracker = add(tracker, {
    roundId: tracker.rounds[0].id,
    questions: '编辑后保留的第一题？\n编辑后新增的第二题？',
  }, ids);
  assert.deepEqual(tracker.rounds[0].questions, ['编辑后保留的第一题？', '编辑后新增的第二题？']);

  assert.throws(
    () => parseInterviewQuestions(Array.from({ length: MAX_INTERVIEW_QUESTIONS_PER_ROUND + 1 }, (_, index) => `题目 ${index}`)),
    (error) => error instanceof TrackerDataError && error.code === 'too_many_questions' && error.field === 'questions',
  );
  assert.throws(
    () => parseInterviewQuestions('问'.repeat(MAX_INTERVIEW_QUESTION_LENGTH + 1)),
    (error) => error instanceof TrackerDataError && error.code === 'question_too_long' && error.field === 'questions',
  );
});

test('被问题目的非法备份不会被静默裁剪', () => {
  const ids = makeIds();
  const payload = add(createEmptyTracker('owner/repo'), {}, ids);
  payload.rounds[0].questions = ['合法题目', '问'.repeat(MAX_INTERVIEW_QUESTION_LENGTH + 1)];
  assert.throws(
    () => sanitizeTracker(payload),
    (error) => error instanceof TrackerDataError
      && error.code === 'lossy_sanitization'
      && error.diagnostics.some((item) => item.reason === 'question_too_long'),
  );
});

test('流程级批量整理稿包含全部题目但不会自动上传或带入公司身份', () => {
  const ids = makeIds();
  let tracker = add(createEmptyTracker('owner/repo'), {
    company: '真实公司名称',
    role: '大模型平台工程师',
    source: '内部员工推荐',
    questions: '第一道题？\n第二道题？',
  }, ids);
  tracker = add(tracker, {
    applicationId: tracker.applications[0].id,
    date: '2026-07-18',
    stage: 'second',
    questions: '第三道题？',
  }, ids, '2026-07-18T08:00:00.000Z');

  const batchDraft = buildQuestionBatchDraft(buildApplicationViews(tracker)[0]);
  assert.match(batchDraft, /共 3 道题/);
  assert.match(batchDraft, /第一道题|第二道题|第三道题/);
  assert.match(batchDraft, /不会自动上传|未经我明确确认，不要修改文件或上传 GitHub/);
  assert.doesNotMatch(batchDraft, /真实公司名称|内部员工推荐|2026-07-18/);
});

test('同公司多轮只计一家公司，轮次和岗位流程分别统计', () => {
  const ids = makeIds();
  let tracker = createEmptyTracker('owner/repo', '2026-07-16T07:00:00.000Z');
  tracker = add(tracker, {}, ids);
  const firstApplicationId = tracker.applications[0].id;
  tracker = add(tracker, {
    applicationId: firstApplicationId,
    date: '2026-07-18',
    stage: 'second',
    outcome: 'passed',
  }, ids, '2026-07-18T08:00:00.000Z');
  tracker = add(tracker, {
    role: '大模型平台工程师',
    date: '2026-07-19',
    outcome: 'failed',
  }, ids, '2026-07-19T08:00:00.000Z');

  assert.equal(tracker.companies.length, 1);
  assert.equal(tracker.applications.length, 2);
  assert.equal(tracker.rounds.length, 3);
  assert.deepEqual(summarizeTracker(tracker, '2026-07-20'), {
    interviewedCompanies: 1,
    interviewedApplications: 2,
    completedRounds: 3,
    activeApplications: 1,
    offers: 0,
    waitingApplications: 0,
    upcomingRounds: 0,
  });
});

test('导入后即使同名公司拥有不同 ID，公司统计仍按名称去重', () => {
  const idsA = makeIds();
  const idsB = makeIds();
  const first = add(createEmptyTracker('owner/repo'), { company: '某科技公司', role: '算法岗' }, idsA);
  const second = add(createEmptyTracker('other/repo'), { company: ' 某科技公司 ', role: '平台岗' }, idsB);
  second.companies[0].id = 'company_other';
  second.applications[0].id = 'application_other';
  second.applications[0].companyId = 'company_other';
  second.rounds[0].id = 'round_other';
  second.rounds[0].applicationId = 'application_other';

  const merged = mergeTrackers(first, second, { repositoryId: 'owner/repo' });
  assert.equal(merged.companies.length, 2);
  assert.equal(summarizeTracker(merged, '2026-07-16').interviewedCompanies, 1);
});

test('顶部新增始终创建新流程，只有显式 applicationId 才追加下一轮', () => {
  const ids = makeIds();
  let tracker = add(createEmptyTracker('owner/repo'), {}, ids);
  tracker = add(tracker, { date: '2026-07-17' }, ids);
  assert.equal(tracker.applications.length, 2);

  const firstApplicationId = tracker.applications[0].id;
  tracker = add(tracker, { applicationId: firstApplicationId, date: '2026-07-18' }, ids);
  assert.equal(tracker.applications.length, 2);
  assert.equal(tracker.rounds.filter((round) => round.applicationId === firstApplicationId).length, 2);
});

test('追加下一轮的空白流程字段不会清掉来源、下一步和跟进日期', () => {
  const ids = makeIds();
  let tracker = add(createEmptyTracker('owner/repo'), {
    source: '内推',
    nextAction: '准备系统设计',
    nextActionOn: '2026-07-20',
  }, ids);
  const applicationId = tracker.applications[0].id;
  tracker = add(tracker, { applicationId, date: '2026-07-18' }, ids);
  assert.deepEqual(
    (({ source, nextAction, nextActionOn }) => ({ source, nextAction, nextActionOn }))(tracker.applications[0]),
    { source: '内推', nextAction: '准备系统设计', nextActionOn: '2026-07-20' },
  );
});

test('流程信息通过独立操作修改，不需要改写历史轮次', () => {
  const ids = makeIds();
  let tracker = add(createEmptyTracker('owner/repo'), {}, ids);
  const originalRound = { ...tracker.rounds[0] };
  tracker = updateApplication(tracker, {
    applicationId: tracker.applications[0].id,
    company: '修正后的公司代号',
    role: '平台工程师',
    source: '官网',
    nextAction: '三天后跟进',
    nextActionOn: '2026-07-19',
  }, { idFactory: ids, repositoryId: 'owner/repo', now: '2026-07-17T00:00:00.000Z' });

  assert.equal(tracker.companies[0].name, '修正后的公司代号');
  assert.equal(tracker.applications[0].role, '平台工程师');
  assert.deepEqual(tracker.rounds[0], originalRound);
});

test('预约、取消和未来完成记录不会计入已经面试', () => {
  const ids = makeIds();
  let tracker = createEmptyTracker('owner/repo');
  tracker = add(tracker, { outcome: 'scheduled', date: '2026-07-20' }, ids);
  tracker = add(tracker, { company: '另一家公司', outcome: 'cancelled', date: '2026-07-15' }, ids);
  tracker = add(tracker, { company: '未来公司', outcome: 'waiting', date: '2026-08-01' }, ids);

  const summary = summarizeTracker(tracker, '2026-07-16');
  assert.equal(summary.interviewedCompanies, 0);
  assert.equal(summary.completedRounds, 0);
  assert.equal(summary.upcomingRounds, 1);
});

test('流程列表支持公司岗位、被问题目搜索以及最新状态和年份交集筛选', () => {
  const ids = makeIds();
  let tracker = createEmptyTracker('owner/repo');
  tracker = add(tracker, { company: '甲公司', role: '算法岗', date: '2025-12-20', outcome: 'failed' }, ids);
  tracker = add(tracker, { company: '乙公司', role: '平台岗', date: '2026-07-16', outcome: 'waiting', reflection: '重点讨论 RAG', questions: '如何设计混合检索？' }, ids);
  const views = buildApplicationViews(tracker);

  assert.equal(filterApplicationViews(views, { query: 'rag', outcome: 'waiting', year: '2026' }).length, 1);
  assert.equal(filterApplicationViews(views, { query: '混合检索', outcome: 'waiting', year: '2026' }).length, 1);
  assert.equal(filterApplicationViews(views, { query: '算法', year: '2026' }).length, 0);
});

test('下一步和已预约面试会进入按日期排序的近期安排', () => {
  const ids = makeIds();
  let tracker = createEmptyTracker('owner/repo');
  tracker = add(tracker, {
    outcome: 'scheduled',
    date: '2026-07-20',
    nextAction: '发送感谢邮件',
    nextActionOn: '2026-07-18',
  }, ids);

  const upcoming = listUpcomingItems(tracker, '2026-07-16');
  assert.deepEqual(upcoming.map((item) => [item.type, item.date]), [
    ['action', '2026-07-18'],
    ['interview', '2026-07-20'],
  ]);
  assert.ok(upcoming.every((item) => item.overdue === false));
});

test('过期待办和已预约项目不会丢失，并排在今天与未来项目之前', () => {
  const ids = makeIds();
  let tracker = createEmptyTracker('owner/repo');
  tracker = add(tracker, {
    company: '过期公司',
    outcome: 'scheduled',
    date: '2026-07-10',
    nextAction: '补发感谢邮件',
    nextActionOn: '2026-07-12',
  }, ids);
  tracker = add(tracker, {
    company: '今天公司',
    outcome: 'scheduled',
    date: '2026-07-16',
  }, ids);
  tracker = add(tracker, {
    company: '未来公司',
    outcome: 'scheduled',
    date: '2026-07-20',
    nextAction: '准备材料',
    nextActionOn: '2026-07-18',
  }, ids);

  const items = listUpcomingItems(tracker, '2026-07-16');
  assert.deepEqual(items.map((item) => [item.date, item.overdue]), [
    ['2026-07-10', true],
    ['2026-07-12', true],
    ['2026-07-16', false],
    ['2026-07-18', false],
    ['2026-07-20', false],
  ]);
});

test('删除轮次会清理空流程和孤立公司，删除流程会级联轮次', () => {
  const ids = makeIds();
  let tracker = add(createEmptyTracker('owner/repo'), {}, ids);
  tracker = removeRound(tracker, tracker.rounds[0].id, { now: '2026-07-17T00:00:00.000Z' });
  assert.deepEqual([tracker.companies.length, tracker.applications.length, tracker.rounds.length], [0, 0, 0]);

  tracker = add(tracker, {}, ids);
  tracker = removeApplication(tracker, tracker.applications[0].id, { now: '2026-07-18T00:00:00.000Z' });
  assert.deepEqual([tracker.companies.length, tracker.applications.length, tracker.rounds.length], [0, 0, 0]);
});

test('JSON 备份可跨仓库恢复并按 ID 合并，且保留分享计划和被问题目', () => {
  const ids = makeIds();
  const original = add(createEmptyTracker('old/repo'), { outcome: 'offer', visibility: 'public', questions: '备份中的题目？' }, ids);
  const backup = createTrackerBackup(original, '2026-07-16T10:00:00.000Z');
  assert.equal(backup.format, TRACKER_BACKUP_FORMAT);

  const parsed = parseTrackerBackup(JSON.stringify(backup), { repositoryId: 'new/repo' });
  assert.equal(parsed.exportedAt, '2026-07-16T10:00:00.000Z');
  assert.equal(parsed.crossRepository, true);
  const merged = mergeTrackers(createEmptyTracker('new/repo'), parsed.data, {
    repositoryId: 'new/repo',
    now: '2026-07-16T11:00:00.000Z',
  });
  assert.equal(merged.repositoryId, 'new/repo');
  assert.equal(merged.rounds.length, 1);
  assert.equal(merged.applications[0].visibility, 'public');
  assert.deepEqual(merged.rounds[0].questions, ['备份中的题目？']);
  assert.equal(summarizeTracker(merged, '2026-07-16').offers, 1);
});

test('导入同 ID 冲突时默认保留本机内容并报告冲突', () => {
  const ids = makeIds();
  const local = add(createEmptyTracker('owner/repo'), { reflection: '本机复盘' }, ids);
  const imported = structuredClone(local);
  imported.rounds[0].reflection = '导入文件覆盖内容';
  imported.rounds[0].updatedAt = '2099-01-01T00:00:00.000Z';
  let conflicts = 0;

  const merged = mergeTrackers(local, imported, {
    repositoryId: 'owner/repo',
    onConflict: () => { conflicts += 1; },
  });
  assert.equal(merged.rounds[0].reflection, '本机复盘');
  assert.equal(conflicts, 1);
});

test('未来数据版本会被拒绝且不会降级覆盖', () => {
  const payload = { ...createEmptyTracker('owner/repo'), schemaVersion: 99 };
  assert.throws(
    () => parseTrackerBackup(payload, { repositoryId: 'owner/repo' }),
    (error) => error instanceof TrackerDataError && error.code === 'future_version',
  );
});

test('恢复 JSON 遇到孤立或重复实体会拒绝导入，避免把裁剪结果当成完整备份', () => {
  const payload = createEmptyTracker('owner/repo');
  payload.rounds = [{
    id: 'round_orphan',
    applicationId: 'application_missing',
    date: '2026-07-16',
  }];

  assert.throws(
    () => parseTrackerBackup(payload, { repositoryId: 'owner/repo' }),
    (error) => error instanceof TrackerDataError
      && error.code === 'lossy_sanitization'
      && error.diagnostics[0].reason === 'missing_application',
  );
});

test('CSV 导出防止表格公式注入，并保留中文字段、分享计划与被问题目', () => {
  assert.equal(escapeCsvCell('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"');
  const ids = makeIds();
  const tracker = add(createEmptyTracker('owner/repo'), {
    company: '+危险公司',
    reflection: '@命令',
    visibility: 'public',
    questions: '=危险公式题\n普通题目',
  }, ids);
  const csv = trackerToCsv(tracker);
  assert.match(csv, /公司 \/ 匿名代号/);
  assert.match(csv, /分享计划/);
  assert.match(csv, /准备匿名分享（仍不会自动上传）/);
  assert.match(csv, /被问题目（每行一道）/);
  assert.match(csv, /普通题目/);
  assert.match(csv, /"'\+危险公司"/);
  assert.match(csv, /"'@命令"/);
});
