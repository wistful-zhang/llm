export const TRACKER_FORMAT = 'llm-interview-tracker';
export const TRACKER_BACKUP_FORMAT = 'llm-interview-tracker-backup';
export const TRACKER_SCHEMA_VERSION = 1;

export const OUTCOMES = Object.freeze({
  scheduled: '已预约',
  waiting: '待反馈',
  passed: '进入下一轮',
  failed: '未通过',
  offer: '收到 Offer',
  withdrawn: '主动结束',
  cancelled: '已取消',
});

export const STAGES = Object.freeze({
  hr_screen: 'HR 初筛',
  first: '技术一面',
  second: '技术二面',
  third: '技术三面',
  manager: '主管面',
  hr: 'HR 面',
  final: '终面',
  other: '其他轮次',
});

export const MODES = Object.freeze({
  online: '线上',
  onsite: '线下',
  phone: '电话',
  other: '其他',
});

const OUTCOME_STATE = Object.freeze({
  scheduled: Object.freeze({ status: 'scheduled', result: 'pending' }),
  waiting: Object.freeze({ status: 'completed', result: 'pending' }),
  passed: Object.freeze({ status: 'completed', result: 'passed' }),
  failed: Object.freeze({ status: 'completed', result: 'failed' }),
  offer: Object.freeze({ status: 'completed', result: 'offer' }),
  withdrawn: Object.freeze({ status: 'completed', result: 'withdrawn' }),
  cancelled: Object.freeze({ status: 'cancelled', result: 'unknown' }),
});

const ACTIVE_OUTCOMES = new Set(['scheduled', 'waiting', 'passed']);
const DANGEROUS_CSV_PREFIX = /^[\t\r ]*[=+\-@]/;

export class TrackerDataError extends Error {
  constructor(message, code = 'invalid_data', field = '') {
    super(message);
    this.name = 'TrackerDataError';
    this.code = code;
    this.field = field;
  }
}

const isPlainObject = (value) => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const asArray = (value) => (Array.isArray(value) ? value : []);

const cleanText = (value, maxLength = 2000) => String(value ?? '')
  .normalize('NFKC')
  .replace(/\r\n?/g, '\n')
  .trim()
  .slice(0, maxLength);

const cleanInlineText = (value, maxLength = 120) => cleanText(value, maxLength)
  .replace(/\s+/g, ' ');

const cleanId = (value) => cleanInlineText(value, 120).replace(/[^a-zA-Z0-9:_-]/g, '');

const cleanTimestamp = (value, fallback) => {
  const date = new Date(String(value || ''));
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
};

const cleanRating = (value) => {
  const rating = Number.parseInt(value, 10);
  return Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : 0;
};

const pickEnum = (value, options, fallback) => (
  Object.hasOwn(options, value) ? value : fallback
);

const compareNewest = (left, right) => {
  const dateOrder = String(right.date || '').localeCompare(String(left.date || ''));
  if (dateOrder !== 0) return dateOrder;
  return String(right.updatedAt || '').localeCompare(String(left.updatedAt || ''));
};

const nextRevision = (value) => Math.max(0, Number.parseInt(value, 10) || 0) + 1;

const cloneTracker = (value) => ({
  ...value,
  companies: value.companies.map((item) => ({ ...item })),
  applications: value.applications.map((item) => ({ ...item })),
  rounds: value.rounds.map((item) => ({ ...item })),
});

const newId = (prefix, idFactory) => {
  const candidate = cleanId(idFactory?.(prefix));
  if (!candidate) throw new TrackerDataError('无法生成记录编号，请刷新页面后重试。', 'id_generation');
  return candidate.startsWith(`${prefix}_`) ? candidate : `${prefix}_${candidate}`;
};

export function normalizeCompanyName(value) {
  return cleanInlineText(value, 80).toLocaleLowerCase('zh-CN');
}

export function normalizeRole(value) {
  return cleanInlineText(value, 80).toLocaleLowerCase('zh-CN');
}

export function isValidDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function roundOutcome(round) {
  if (round?.status === 'scheduled') return 'scheduled';
  if (round?.status === 'cancelled') return 'cancelled';
  if (round?.status !== 'completed') return 'waiting';
  if (round.result === 'passed') return 'passed';
  if (round.result === 'failed') return 'failed';
  if (round.result === 'offer') return 'offer';
  if (round.result === 'withdrawn') return 'withdrawn';
  return 'waiting';
}

export function createEmptyTracker(repositoryId = '', now = new Date().toISOString()) {
  const timestamp = cleanTimestamp(now, new Date().toISOString());
  return {
    format: TRACKER_FORMAT,
    schemaVersion: TRACKER_SCHEMA_VERSION,
    repositoryId: cleanInlineText(repositoryId, 200),
    revision: 0,
    updatedAt: timestamp,
    companies: [],
    applications: [],
    rounds: [],
  };
}

export function sanitizeTracker(value, options = {}) {
  if (!isPlainObject(value)) throw new TrackerDataError('面试记录不是有效的数据对象。');
  if (value.format !== TRACKER_FORMAT) throw new TrackerDataError('这不是大模型面经的面试记录备份。', 'wrong_format');

  const version = Number.parseInt(value.schemaVersion, 10);
  if (version > TRACKER_SCHEMA_VERSION) {
    throw new TrackerDataError('这份记录由更新版本创建，请先更新网站后再导入。', 'future_version');
  }
  if (version !== TRACKER_SCHEMA_VERSION) {
    throw new TrackerDataError('暂不支持这份旧版记录，请保留原文件并更新项目。', 'unsupported_version');
  }

  const fallbackNow = cleanTimestamp(options.now, new Date().toISOString());
  const companies = [];
  const companyIds = new Set();
  for (const item of asArray(value.companies)) {
    if (!isPlainObject(item)) continue;
    const id = cleanId(item.id);
    const name = cleanInlineText(item.name, 80);
    if (!id || !name || companyIds.has(id)) continue;
    companyIds.add(id);
    companies.push({
      id,
      name,
      normalizedName: normalizeCompanyName(name),
      createdAt: cleanTimestamp(item.createdAt, fallbackNow),
      updatedAt: cleanTimestamp(item.updatedAt, fallbackNow),
    });
  }

  const applications = [];
  const applicationIds = new Set();
  for (const item of asArray(value.applications)) {
    if (!isPlainObject(item)) continue;
    const id = cleanId(item.id);
    const companyId = cleanId(item.companyId);
    const role = cleanInlineText(item.role, 80);
    if (!id || !companyIds.has(companyId) || !role || applicationIds.has(id)) continue;
    applicationIds.add(id);
    applications.push({
      id,
      companyId,
      role,
      source: cleanInlineText(item.source, 120),
      nextAction: cleanInlineText(item.nextAction, 160),
      nextActionOn: isValidDate(item.nextActionOn) ? item.nextActionOn : '',
      createdAt: cleanTimestamp(item.createdAt, fallbackNow),
      updatedAt: cleanTimestamp(item.updatedAt, fallbackNow),
    });
  }

  const rounds = [];
  const roundIds = new Set();
  for (const item of asArray(value.rounds)) {
    if (!isPlainObject(item)) continue;
    const id = cleanId(item.id);
    const applicationId = cleanId(item.applicationId);
    if (!id || !applicationIds.has(applicationId) || !isValidDate(item.date) || roundIds.has(id)) continue;

    const outcome = Object.hasOwn(OUTCOMES, item.outcome) ? item.outcome : roundOutcome(item);
    const state = OUTCOME_STATE[outcome];
    roundIds.add(id);
    rounds.push({
      id,
      applicationId,
      date: item.date,
      stage: pickEnum(item.stage, STAGES, 'other'),
      outcome,
      status: state.status,
      result: state.result,
      mode: pickEnum(item.mode, MODES, 'online'),
      rating: cleanRating(item.rating),
      reflection: cleanText(item.reflection, 3000),
      createdAt: cleanTimestamp(item.createdAt, fallbackNow),
      updatedAt: cleanTimestamp(item.updatedAt, fallbackNow),
    });
  }

  return {
    format: TRACKER_FORMAT,
    schemaVersion: TRACKER_SCHEMA_VERSION,
    repositoryId: cleanInlineText(options.repositoryId ?? value.repositoryId, 200),
    revision: Math.max(0, Number.parseInt(value.revision, 10) || 0),
    updatedAt: cleanTimestamp(value.updatedAt, fallbackNow),
    companies,
    applications,
    rounds,
  };
}

export function upsertInterview(tracker, input, options = {}) {
  const data = cloneTracker(sanitizeTracker(tracker, options));
  const now = cleanTimestamp(options.now, new Date().toISOString());
  const companyName = cleanInlineText(input?.company, 80);
  const role = cleanInlineText(input?.role, 80);
  const date = String(input?.date || '');
  const outcome = pickEnum(input?.outcome, OUTCOMES, 'waiting');

  if (!companyName) throw new TrackerDataError('请填写公司名称或匿名代号。', 'required', 'company');
  if (!role) throw new TrackerDataError('请填写岗位名称。', 'required', 'role');
  if (!isValidDate(date)) throw new TrackerDataError('请选择有效的面试日期。', 'invalid_date', 'date');

  let round = input?.roundId ? data.rounds.find((item) => item.id === input.roundId) : null;
  let application = round
    ? data.applications.find((item) => item.id === round.applicationId)
    : data.applications.find((item) => item.id === input?.applicationId);
  const continuingApplication = Boolean(application && !round);

  let company = application
    ? data.companies.find((item) => item.id === application.companyId)
    : null;

  const companyKey = normalizeCompanyName(companyName);
  if (!company || company.normalizedName !== companyKey) {
    company = data.companies.find((item) => item.normalizedName === companyKey);
    if (!company) {
      company = {
        id: newId('company', options.idFactory),
        name: companyName,
        normalizedName: companyKey,
        createdAt: now,
        updatedAt: now,
      };
      data.companies.push(company);
    }
  }
  company.name = companyName;
  company.normalizedName = companyKey;
  company.updatedAt = now;

  if (!application) {
    application = {
      id: newId('application', options.idFactory),
      companyId: company.id,
      role,
      source: '',
      nextAction: '',
      nextActionOn: '',
      createdAt: now,
      updatedAt: now,
    };
    data.applications.push(application);
  }

  application.companyId = company.id;
  application.role = role;
  const source = cleanInlineText(input?.source, 120);
  const nextAction = cleanInlineText(input?.nextAction, 160);
  const nextActionOn = isValidDate(input?.nextActionOn) ? input.nextActionOn : '';
  if (!continuingApplication || source) application.source = source;
  if (!continuingApplication || nextAction || nextActionOn) {
    application.nextAction = nextAction;
    application.nextActionOn = nextActionOn;
  }
  application.updatedAt = now;

  const state = OUTCOME_STATE[outcome];
  const roundValue = {
    id: round?.id || newId('round', options.idFactory),
    applicationId: application.id,
    date,
    stage: pickEnum(input?.stage, STAGES, 'first'),
    outcome,
    status: state.status,
    result: state.result,
    mode: pickEnum(input?.mode, MODES, 'online'),
    rating: cleanRating(input?.rating),
    reflection: cleanText(input?.reflection, 3000),
    createdAt: round?.createdAt || now,
    updatedAt: now,
  };

  if (round) Object.assign(round, roundValue);
  else data.rounds.push(roundValue);

  const usedCompanyIds = new Set(data.applications.map((item) => item.companyId));
  data.companies = data.companies.filter((item) => usedCompanyIds.has(item.id));
  data.repositoryId = cleanInlineText(options.repositoryId ?? data.repositoryId, 200);
  data.revision = nextRevision(data.revision);
  data.updatedAt = now;
  return data;
}

export function updateApplication(tracker, input, options = {}) {
  const data = cloneTracker(sanitizeTracker(tracker, options));
  const now = cleanTimestamp(options.now, new Date().toISOString());
  const application = data.applications.find((item) => item.id === input?.applicationId);
  if (!application) throw new TrackerDataError('没有找到要修改的面试流程。', 'missing_application');

  const companyName = cleanInlineText(input?.company, 80);
  const role = cleanInlineText(input?.role, 80);
  if (!companyName) throw new TrackerDataError('请填写公司名称或匿名代号。', 'required', 'company');
  if (!role) throw new TrackerDataError('请填写岗位名称。', 'required', 'role');

  const companyKey = normalizeCompanyName(companyName);
  let company = data.companies.find((item) => item.normalizedName === companyKey);
  if (!company) {
    company = {
      id: newId('company', options.idFactory),
      name: companyName,
      normalizedName: companyKey,
      createdAt: now,
      updatedAt: now,
    };
    data.companies.push(company);
  } else {
    company.name = companyName;
    company.updatedAt = now;
  }

  application.companyId = company.id;
  application.role = role;
  application.source = cleanInlineText(input?.source, 120);
  application.nextAction = cleanInlineText(input?.nextAction, 160);
  application.nextActionOn = isValidDate(input?.nextActionOn) ? input.nextActionOn : '';
  application.updatedAt = now;

  const usedCompanyIds = new Set(data.applications.map((item) => item.companyId));
  data.companies = data.companies.filter((item) => usedCompanyIds.has(item.id));
  data.repositoryId = cleanInlineText(options.repositoryId ?? data.repositoryId, 200);
  data.revision = nextRevision(data.revision);
  data.updatedAt = now;
  return data;
}

export function removeRound(tracker, roundId, options = {}) {
  const data = cloneTracker(sanitizeTracker(tracker, options));
  const target = data.rounds.find((item) => item.id === roundId);
  if (!target) return data;

  data.rounds = data.rounds.filter((item) => item.id !== roundId);
  const usedApplicationIds = new Set(data.rounds.map((item) => item.applicationId));
  data.applications = data.applications.filter((item) => usedApplicationIds.has(item.id));
  const usedCompanyIds = new Set(data.applications.map((item) => item.companyId));
  data.companies = data.companies.filter((item) => usedCompanyIds.has(item.id));
  data.revision = nextRevision(data.revision);
  data.updatedAt = cleanTimestamp(options.now, new Date().toISOString());
  return data;
}

export function removeApplication(tracker, applicationId, options = {}) {
  const data = cloneTracker(sanitizeTracker(tracker, options));
  if (!data.applications.some((item) => item.id === applicationId)) return data;
  data.rounds = data.rounds.filter((item) => item.applicationId !== applicationId);
  data.applications = data.applications.filter((item) => item.id !== applicationId);
  const usedCompanyIds = new Set(data.applications.map((item) => item.companyId));
  data.companies = data.companies.filter((item) => usedCompanyIds.has(item.id));
  data.revision = nextRevision(data.revision);
  data.updatedAt = cleanTimestamp(options.now, new Date().toISOString());
  return data;
}

export function getLatestRound(rounds) {
  return [...asArray(rounds)].sort(compareNewest)[0] || null;
}

export function buildApplicationViews(tracker) {
  const companyById = new Map(tracker.companies.map((item) => [item.id, item]));
  return tracker.applications
    .map((application) => {
      const rounds = tracker.rounds
        .filter((round) => round.applicationId === application.id)
        .sort(compareNewest);
      const latestRound = getLatestRound(rounds);
      return {
        application,
        company: companyById.get(application.companyId),
        rounds,
        latestRound,
        latestOutcome: latestRound ? roundOutcome(latestRound) : 'waiting',
      };
    })
    .filter((view) => view.company && view.rounds.length > 0)
    .sort((left, right) => compareNewest(left.latestRound, right.latestRound));
}

export function filterApplicationViews(views, filters = {}) {
  const query = cleanInlineText(filters.query, 120).toLocaleLowerCase('zh-CN');
  const outcome = Object.hasOwn(OUTCOMES, filters.outcome) ? filters.outcome : '';
  const year = /^\d{4}$/.test(String(filters.year || '')) ? String(filters.year) : '';

  return asArray(views).filter((view) => {
    if (outcome && view.latestOutcome !== outcome) return false;
    if (year && !view.rounds.some((round) => round.date.startsWith(`${year}-`))) return false;
    if (!query) return true;
    const searchable = [
      view.company?.name,
      view.application?.role,
      view.application?.source,
      view.application?.nextAction,
      ...view.rounds.map((round) => round.reflection),
    ].join(' ').normalize('NFKC').toLocaleLowerCase('zh-CN');
    return searchable.includes(query);
  });
}

export function listTrackerYears(tracker) {
  return [...new Set(tracker.rounds.map((round) => round.date.slice(0, 4)))]
    .filter((year) => /^\d{4}$/.test(year))
    .sort((left, right) => right.localeCompare(left));
}

export function summarizeTracker(tracker, today) {
  const currentDate = isValidDate(today) ? today : '9999-12-31';
  const completedRounds = tracker.rounds.filter((round) => (
    round.status === 'completed' && round.date <= currentDate
  ));
  const completedApplicationIds = new Set(completedRounds.map((round) => round.applicationId));
  const applicationById = new Map(tracker.applications.map((item) => [item.id, item]));
  const companyById = new Map(tracker.companies.map((item) => [item.id, item]));
  const interviewedCompanyNames = new Set(
    [...completedApplicationIds]
      .map((id) => applicationById.get(id)?.companyId)
      .map((id) => companyById.get(id)?.normalizedName)
      .filter(Boolean),
  );
  const views = buildApplicationViews(tracker);
  const activeApplications = views.filter((view) => ACTIVE_OUTCOMES.has(view.latestOutcome)).length;
  const offerApplicationIds = new Set(
    completedRounds.filter((round) => round.result === 'offer').map((round) => round.applicationId),
  );

  return {
    interviewedCompanies: interviewedCompanyNames.size,
    interviewedApplications: completedApplicationIds.size,
    completedRounds: completedRounds.length,
    activeApplications,
    offers: offerApplicationIds.size,
    waitingApplications: views.filter((view) => view.latestOutcome === 'waiting').length,
    upcomingRounds: tracker.rounds.filter((round) => round.status === 'scheduled' && round.date >= currentDate).length,
  };
}

export function listUpcomingItems(tracker, today) {
  const currentDate = isValidDate(today) ? today : '0000-01-01';
  const views = buildApplicationViews(tracker);
  const items = [];
  for (const view of views) {
    for (const round of view.rounds) {
      if (round.status === 'scheduled' && round.date >= currentDate) {
        items.push({
          type: 'interview',
          date: round.date,
          company: view.company.name,
          role: view.application.role,
          label: STAGES[round.stage],
          applicationId: view.application.id,
          roundId: round.id,
        });
      }
    }
    if (view.application.nextAction && view.application.nextActionOn >= currentDate) {
      items.push({
        type: 'action',
        date: view.application.nextActionOn,
        company: view.company.name,
        role: view.application.role,
        label: view.application.nextAction,
        applicationId: view.application.id,
      });
    }
  }
  return items.sort((left, right) => left.date.localeCompare(right.date));
}

const mergeEntities = (left, right, entityType, onConflict) => {
  const merged = new Map();
  left.forEach((item) => {
    if (!item?.id) return;
    merged.set(item.id, item);
  });
  right.forEach((item) => {
    if (!item?.id) return;
    if (!merged.has(item.id)) {
      merged.set(item.id, item);
      return;
    }
    const local = merged.get(item.id);
    if (JSON.stringify(local) !== JSON.stringify(item)) onConflict?.({ entityType, id: item.id, local, imported: item });
  });
  return [...merged.values()];
};

export function mergeTrackers(current, imported, options = {}) {
  const now = cleanTimestamp(options.now, new Date().toISOString());
  const left = sanitizeTracker(current, options);
  const right = sanitizeTracker(imported, options);
  const onConflict = typeof options.onConflict === 'function' ? options.onConflict : null;
  const merged = sanitizeTracker({
    ...left,
    repositoryId: options.repositoryId ?? left.repositoryId,
    revision: nextRevision(left.revision),
    updatedAt: now,
    companies: mergeEntities(left.companies, right.companies, 'company', onConflict),
    applications: mergeEntities(left.applications, right.applications, 'application', onConflict),
    rounds: mergeEntities(left.rounds, right.rounds, 'round', onConflict),
  }, { ...options, now });
  merged.revision = nextRevision(left.revision);
  merged.updatedAt = now;
  return merged;
}

export function createTrackerBackup(tracker, exportedAt = new Date().toISOString()) {
  const data = sanitizeTracker(tracker, { now: exportedAt });
  return {
    format: TRACKER_BACKUP_FORMAT,
    formatVersion: 1,
    exportedAt: cleanTimestamp(exportedAt, new Date().toISOString()),
    repositoryId: data.repositoryId,
    data,
  };
}

export function parseTrackerBackup(value, options = {}) {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new TrackerDataError('备份文件不是有效的 JSON。', 'invalid_json');
    }
  }
  if (!isPlainObject(parsed)) throw new TrackerDataError('备份文件内容无效。');

  const payload = parsed.format === TRACKER_BACKUP_FORMAT ? parsed.data : parsed;
  const sourceRepositoryId = cleanInlineText(
    parsed.format === TRACKER_BACKUP_FORMAT ? parsed.repositoryId : payload?.repositoryId,
    200,
  );
  const data = sanitizeTracker(payload, { ...options, repositoryId: sourceRepositoryId });
  return {
    data,
    sourceRepositoryId,
    crossRepository: Boolean(options.repositoryId && sourceRepositoryId && options.repositoryId !== sourceRepositoryId),
  };
}

export function escapeCsvCell(value) {
  let text = String(value ?? '').replace(/\r\n?/g, '\n');
  if (DANGEROUS_CSV_PREFIX.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function trackerToCsv(tracker) {
  const views = buildApplicationViews(tracker);
  const rows = [[
    '公司 / 匿名代号', '岗位', '面试日期', '轮次', '结果', '方式', '自评',
    '匿名来源', '下一步', '跟进日期', '复盘',
  ]];
  for (const view of views) {
    for (const round of [...view.rounds].reverse()) {
      rows.push([
        view.company.name,
        view.application.role,
        round.date,
        STAGES[round.stage],
        OUTCOMES[roundOutcome(round)],
        MODES[round.mode],
        round.rating || '',
        view.application.source,
        view.application.nextAction,
        view.application.nextActionOn,
        round.reflection,
      ]);
    }
  }
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
}

export function nextStage(stage) {
  const sequence = ['hr_screen', 'first', 'second', 'third', 'manager', 'hr', 'final'];
  const index = sequence.indexOf(stage);
  return index >= 0 && index < sequence.length - 1 ? sequence[index + 1] : 'other';
}
