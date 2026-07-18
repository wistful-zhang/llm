export const TRACKER_FORMAT = 'llm-interview-tracker';
export const TRACKER_BACKUP_FORMAT = 'llm-interview-tracker-backup';
export const TRACKER_SCHEMA_VERSION = 3;
export const MAX_INTERVIEW_QUESTIONS_PER_ROUND = 20;
export const MAX_INTERVIEW_QUESTION_LENGTH = 160;

export const VISIBILITIES = Object.freeze({
  private: '仅当前浏览器',
  public: '准备匿名分享（仍不会自动上传）',
});

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

const addSanitizationDiagnostic = (diagnostics, collection, index, reason, id = '') => {
  diagnostics.push({ collection, index, reason, id: cleanInlineText(id, 120) });
};

const cleanText = (value, maxLength = 2000) => String(value ?? '')
  .normalize('NFKC')
  .replace(/\r\n?/g, '\n')
  .trim()
  .slice(0, maxLength);

const cleanInlineText = (value, maxLength = 120) => cleanText(value, maxLength)
  .replace(/\s+/g, ' ');

const normalizeInterviewQuestion = (value) => String(value ?? '')
  .replace(/\r\n?/g, '\n')
  .trim();

export function parseInterviewQuestions(value) {
  const candidates = Array.isArray(value) ? value : String(value ?? '').split(/\r?\n/);
  const questions = [];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') {
      throw new TrackerDataError('每道被问题目都必须是文字。', 'invalid_questions', 'questions');
    }
    const question = normalizeInterviewQuestion(candidate);
    if (!question) continue;
    if (question.includes('\n')) {
      throw new TrackerDataError('每道被问题目必须单独占一行。', 'multiline_question', 'questions');
    }
    if (question.length > MAX_INTERVIEW_QUESTION_LENGTH) {
      throw new TrackerDataError(
        `每道被问题目不能超过 ${MAX_INTERVIEW_QUESTION_LENGTH} 个字符。`,
        'question_too_long',
        'questions',
      );
    }
    questions.push(question);
  }
  if (questions.length > MAX_INTERVIEW_QUESTIONS_PER_ROUND) {
    throw new TrackerDataError(
      `每轮最多记录 ${MAX_INTERVIEW_QUESTIONS_PER_ROUND} 道被问题目。`,
      'too_many_questions',
      'questions',
    );
  }
  return questions;
}

const sanitizeStoredQuestions = (value, report) => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    report('invalid_questions');
    return [];
  }
  if (value.length > MAX_INTERVIEW_QUESTIONS_PER_ROUND) report('too_many_questions');
  const questions = [];
  value.slice(0, MAX_INTERVIEW_QUESTIONS_PER_ROUND).forEach((candidate) => {
    if (typeof candidate !== 'string') {
      report('invalid_question');
      return;
    }
    const question = normalizeInterviewQuestion(candidate);
    if (!question) {
      report('empty_question');
      return;
    }
    if (question.includes('\n')) {
      report('multiline_question');
      return;
    }
    if (question.length > MAX_INTERVIEW_QUESTION_LENGTH) {
      report('question_too_long');
      return;
    }
    questions.push(question);
  });
  return questions;
};

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
  rounds: value.rounds.map((item) => ({ ...item, questions: [...item.questions] })),
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
  if (![1, 2, TRACKER_SCHEMA_VERSION].includes(version)) {
    throw new TrackerDataError('暂不支持这份旧版记录，请保留原文件并更新项目。', 'unsupported_version');
  }

  const fallbackNow = cleanTimestamp(options.now, new Date().toISOString());
  const diagnostics = Array.isArray(options.diagnostics) ? options.diagnostics : [];
  const diagnosticStart = diagnostics.length;
  const collection = (name) => {
    if (Array.isArray(value[name])) return value[name];
    addSanitizationDiagnostic(diagnostics, name, -1, 'invalid_collection');
    return [];
  };
  const companies = [];
  const companyIds = new Set();
  for (const [index, item] of collection('companies').entries()) {
    if (!isPlainObject(item)) {
      addSanitizationDiagnostic(diagnostics, 'companies', index, 'invalid_entity');
      continue;
    }
    const id = cleanId(item.id);
    const name = cleanInlineText(item.name, 80);
    if (!id || !name) {
      addSanitizationDiagnostic(diagnostics, 'companies', index, 'missing_required_field', item.id);
      continue;
    }
    if (companyIds.has(id)) {
      addSanitizationDiagnostic(diagnostics, 'companies', index, 'duplicate_id', id);
      continue;
    }
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
  for (const [index, item] of collection('applications').entries()) {
    if (!isPlainObject(item)) {
      addSanitizationDiagnostic(diagnostics, 'applications', index, 'invalid_entity');
      continue;
    }
    const id = cleanId(item.id);
    const companyId = cleanId(item.companyId);
    const role = cleanInlineText(item.role, 80);
    if (!id || !role) {
      addSanitizationDiagnostic(diagnostics, 'applications', index, 'missing_required_field', item.id);
      continue;
    }
    if (!companyIds.has(companyId)) {
      addSanitizationDiagnostic(diagnostics, 'applications', index, 'missing_company', id);
      continue;
    }
    if (applicationIds.has(id)) {
      addSanitizationDiagnostic(diagnostics, 'applications', index, 'duplicate_id', id);
      continue;
    }
    applicationIds.add(id);
    applications.push({
      id,
      companyId,
      role,
      visibility: version === 1 ? 'private' : pickEnum(item.visibility, VISIBILITIES, 'private'),
      source: cleanInlineText(item.source, 120),
      nextAction: cleanInlineText(item.nextAction, 160),
      nextActionOn: isValidDate(item.nextActionOn) ? item.nextActionOn : '',
      createdAt: cleanTimestamp(item.createdAt, fallbackNow),
      updatedAt: cleanTimestamp(item.updatedAt, fallbackNow),
    });
  }

  const rounds = [];
  const roundIds = new Set();
  for (const [index, item] of collection('rounds').entries()) {
    if (!isPlainObject(item)) {
      addSanitizationDiagnostic(diagnostics, 'rounds', index, 'invalid_entity');
      continue;
    }
    const id = cleanId(item.id);
    const applicationId = cleanId(item.applicationId);
    if (!id || !isValidDate(item.date)) {
      addSanitizationDiagnostic(diagnostics, 'rounds', index, 'missing_required_field', item.id);
      continue;
    }
    if (!applicationIds.has(applicationId)) {
      addSanitizationDiagnostic(diagnostics, 'rounds', index, 'missing_application', id);
      continue;
    }
    if (roundIds.has(id)) {
      addSanitizationDiagnostic(diagnostics, 'rounds', index, 'duplicate_id', id);
      continue;
    }

    const outcome = Object.hasOwn(OUTCOMES, item.outcome) ? item.outcome : roundOutcome(item);
    const state = OUTCOME_STATE[outcome];
    const questions = sanitizeStoredQuestions(item.questions, (reason) => {
      addSanitizationDiagnostic(diagnostics, 'rounds', index, reason, id);
    });
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
      questions,
      reflection: cleanText(item.reflection, 3000),
      createdAt: cleanTimestamp(item.createdAt, fallbackNow),
      updatedAt: cleanTimestamp(item.updatedAt, fallbackNow),
    });
  }

  const newDiagnostics = diagnostics.slice(diagnosticStart);
  if (newDiagnostics.length && options.strict !== false) {
    const error = new TrackerDataError(
      `记录中有 ${newDiagnostics.length} 条无效或重复数据。为避免静默丢失内容，已停止读取；请保留原文件并检查后重试。`,
      'lossy_sanitization',
    );
    error.diagnostics = newDiagnostics;
    throw error;
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
  const questions = parseInterviewQuestions(input?.questions);
  const visibilityProvided = Object.hasOwn(input || {}, 'visibility');
  const visibility = pickEnum(input?.visibility, VISIBILITIES, 'private');

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
      visibility,
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
  if (visibilityProvided) application.visibility = visibility;
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
    questions,
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
  if (Object.hasOwn(input || {}, 'visibility')) {
    application.visibility = pickEnum(input.visibility, VISIBILITIES, 'private');
  }
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
      ...view.rounds.flatMap((round) => round.questions),
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
      if (round.status === 'scheduled') {
        items.push({
          type: 'interview',
          date: round.date,
          overdue: round.date < currentDate,
          company: view.company.name,
          role: view.application.role,
          label: STAGES[round.stage],
          applicationId: view.application.id,
          roundId: round.id,
        });
      }
    }
    if (view.application.nextAction && view.application.nextActionOn) {
      items.push({
        type: 'action',
        date: view.application.nextActionOn,
        overdue: view.application.nextActionOn < currentDate,
        company: view.company.name,
        role: view.application.role,
        label: view.application.nextAction,
        applicationId: view.application.id,
      });
    }
  }
  return items.sort((left, right) => left.date.localeCompare(right.date));
}

const collectQuestionEntries = (view) => [...view.rounds]
  .reverse()
  .flatMap((round) => round.questions.map((question) => ({
    question,
    stage: STAGES[round.stage] || STAGES.other,
  })));

export function buildQuestionBatchDraft(view) {
  if (!view?.application || !Array.isArray(view.rounds)) {
    throw new TrackerDataError('找不到要整理的面试流程。', 'missing_application');
  }
  const entries = collectQuestionEntries(view);
  if (entries.length === 0) {
    throw new TrackerDataError('这个流程还没有记录被问题目。', 'missing_questions');
  }
  const role = cleanInlineText(view.application.role, 80) || '岗位方向待补充';
  const sections = entries.flatMap((entry, index) => [
    `## 题目 ${index + 1}`,
    `题目：${entry.question}`,
    `匿名轮次：${entry.stage}`,
    '建议初始状态：待整理 / 待评估 / 待解答',
    '',
  ]);
  return [
    '面试题批量整理稿（仅复制到剪贴板，不会自动上传）',
    '',
    `岗位方向：${role}`,
    `共 ${entries.length} 道题`,
    '',
    '使用说明：',
    '- 交给 Codex 时，请先逐题整理为可粘贴到 Pages CMS 的字段；不要编造项目经历、公司归属或未经核验的答案。未经我明确确认，不要修改文件或上传 GitHub。',
    '- 使用 Pages CMS 时，请按下面编号逐题 Add an entry；可以先只填题目，并保持“待整理 / 待评估 / 待解答”。',
    '- Public 仓库中即使关闭网页显示，源文件仍然可见；保存前先删除公司身份、个人信息、内部题库和受 NDA 约束的内容。',
    '',
    ...sections,
    '检查提示：以上题目按本机速记原样整理，没有自动判断真实性、授权范围或保密要求，请逐题检查后再决定是否保存或公开。',
  ].join('\n').trim();
}

export function buildPublicExperienceDraft(view, options = {}) {
  if (!view?.application || !Array.isArray(view.rounds)) {
    throw new TrackerDataError('找不到可整理的面试流程。', 'missing_application');
  }
  const role = cleanInlineText(view.application.role, 80) || '岗位方向待补充';
  const rounds = view.rounds.map((round, index) => (
    `${index + 1}. ${STAGES[round.stage] || STAGES.other}：${OUTCOMES[roundOutcome(round)] || '待反馈'}`
  ));
  const questionEntries = options.includeQuestions === true ? collectQuestionEntries(view) : [];
  const questionSection = questionEntries.length > 0 ? [
    '',
    '被问题目（原始速记，需逐条确认匿名和公开权限）：',
    ...questionEntries.map((entry, index) => `${index + 1}. [${entry.stage}] ${entry.question}`),
    '',
    '题目检查提示：题目文字按本机速记原样带入，系统没有判断其中是否包含公司身份、内部题库或受 NDA 约束内容；不适合公开的题目必须删除或改写。',
  ] : [];
  return [
    '匿名面试经历（待二次整理）',
    '',
    `岗位方向：${role}`,
    `面试轮次：${view.rounds.length} 轮`,
    '',
    '流程概览：',
    ...rounds,
    ...questionSection,
    '',
    '公开前请补充：',
    questionEntries.length > 0 ? '- 逐题整理可复用的回答思路' : '- 每轮主要问题与考察方向',
    '- 补充整体复盘与复习建议',
    '',
    '隐私检查：流程字段已排除公司名称、匿名来源、精确日期、下一步、个人复盘和自评分数；题目文字如果被加入则仍是原始速记。发布前必须逐项检查，不要加入面试官信息、联系方式、会议链接、公司机密或受保密协议约束的内容。',
  ].join('\n');
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
  const exportedAt = parsed.format === TRACKER_BACKUP_FORMAT && typeof parsed.exportedAt === 'string'
    && !Number.isNaN(Date.parse(parsed.exportedAt))
    ? parsed.exportedAt
    : '';
  return {
    data,
    exportedAt,
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
    '公司 / 匿名代号', '岗位', '分享计划', '面试日期', '轮次', '结果', '方式', '自评',
    '匿名来源', '下一步', '跟进日期', '复盘', '被问题目（每行一道）',
  ]];
  for (const view of views) {
    for (const round of [...view.rounds].reverse()) {
      rows.push([
        view.company.name,
        view.application.role,
        VISIBILITIES[view.application.visibility],
        round.date,
        STAGES[round.stage],
        OUTCOMES[roundOutcome(round)],
        MODES[round.mode],
        round.rating || '',
        view.application.source,
        view.application.nextAction,
        view.application.nextActionOn,
        round.reflection,
        round.questions.join('\n'),
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
