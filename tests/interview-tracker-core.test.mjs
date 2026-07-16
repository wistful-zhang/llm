import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TRACKER_BACKUP_FORMAT,
  TrackerDataError,
  buildApplicationViews,
  createEmptyTracker,
  createTrackerBackup,
  escapeCsvCell,
  filterApplicationViews,
  listUpcomingItems,
  mergeTrackers,
  parseTrackerBackup,
  removeApplication,
  removeRound,
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

test('流程列表支持公司岗位搜索、最新状态和年份交集筛选', () => {
  const ids = makeIds();
  let tracker = createEmptyTracker('owner/repo');
  tracker = add(tracker, { company: '甲公司', role: '算法岗', date: '2025-12-20', outcome: 'failed' }, ids);
  tracker = add(tracker, { company: '乙公司', role: '平台岗', date: '2026-07-16', outcome: 'waiting', reflection: '重点讨论 RAG' }, ids);
  const views = buildApplicationViews(tracker);

  assert.equal(filterApplicationViews(views, { query: 'rag', outcome: 'waiting', year: '2026' }).length, 1);
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

test('JSON 备份可跨仓库恢复并按 ID 合并', () => {
  const ids = makeIds();
  const original = add(createEmptyTracker('old/repo'), { outcome: 'offer' }, ids);
  const backup = createTrackerBackup(original, '2026-07-16T10:00:00.000Z');
  assert.equal(backup.format, TRACKER_BACKUP_FORMAT);

  const parsed = parseTrackerBackup(JSON.stringify(backup), { repositoryId: 'new/repo' });
  assert.equal(parsed.crossRepository, true);
  const merged = mergeTrackers(createEmptyTracker('new/repo'), parsed.data, {
    repositoryId: 'new/repo',
    now: '2026-07-16T11:00:00.000Z',
  });
  assert.equal(merged.repositoryId, 'new/repo');
  assert.equal(merged.rounds.length, 1);
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

test('CSV 导出防止表格公式注入并保留中文字段', () => {
  assert.equal(escapeCsvCell('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"');
  const ids = makeIds();
  const tracker = add(createEmptyTracker('owner/repo'), {
    company: '+危险公司',
    reflection: '@命令',
  }, ids);
  const csv = trackerToCsv(tracker);
  assert.match(csv, /公司 \/ 匿名代号/);
  assert.match(csv, /"'\+危险公司"/);
  assert.match(csv, /"'@命令"/);
});
