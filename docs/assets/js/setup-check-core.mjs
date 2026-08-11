export const parseWorkerRoot = (value) => {
  const api = new URL(String(value ?? '').trim());
  if (api.protocol !== 'https:'
    || api.username
    || api.password
    || api.search
    || api.hash
    || api.pathname !== '/') {
    throw new TypeError('Worker 网址必须是 HTTPS 根网址');
  }
  return api;
};

export const workerRootsMatch = (left, right) => (
  parseWorkerRoot(left).href === parseWorkerRoot(right).href
);
