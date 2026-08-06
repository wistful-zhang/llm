const root = document.querySelector('[data-comment-setup]');

if (root) {
  const siteId = root.querySelector('[data-generated-site-id]');
  const hashSecret = root.querySelector('[data-generated-hash-secret]');
  const adminToken = root.querySelector('[data-generated-admin-token]');
  const status = root.querySelector('[data-comment-secret-status]');

  const randomText = (byteLength) => {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  };

  const generate = () => {
    siteId.value = `site_${randomText(12)}`;
    hashSecret.value = randomText(32);
    adminToken.value = randomText(32);
    status.textContent = '已生成一组新值，请现在复制到 Cloudflare。';
  };

  const copy = async (input, label) => {
    try {
      await navigator.clipboard.writeText(input.value);
      status.textContent = `${label} 已复制。`;
    } catch {
      input.focus();
      input.select();
      status.textContent = `自动复制失败，已选中 ${label}，请手动复制。`;
    }
  };

  root.querySelector('[data-regenerate-comment-secrets]')?.addEventListener('click', generate);
  root.querySelector('[data-copy-generated="site"]')?.addEventListener('click', () => void copy(siteId, 'SITE_ID'));
  root.querySelector('[data-copy-generated="hash"]')?.addEventListener('click', () => void copy(hashSecret, 'HASH_SECRET'));
  root.querySelector('[data-copy-generated="admin"]')?.addEventListener('click', () => void copy(adminToken, 'ADMIN_TOKEN'));
  generate();
}
