const controls = [...document.querySelectorAll('[data-share-controls]')];

const copyText = async (value) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // 受限浏览器继续使用选择复制兜底。
    }
  }

  const input = document.createElement('textarea');
  input.value = value;
  input.readOnly = true;
  input.tabIndex = -1;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.append(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  return copied;
};

controls.forEach((root) => {
  const shareButton = root.querySelector('[data-share-page]');
  const copyButton = root.querySelector('[data-copy-page-link]');
  const status = root.parentElement?.querySelector('[data-share-status]');
  const title = root.dataset.shareTitle || document.title;
  const url = window.location.href;

  const announce = (message) => {
    if (!status) return;
    status.textContent = message;
  };

  root.hidden = false;

  copyButton?.addEventListener('click', async () => {
    try {
      const copied = await copyText(url);
      announce(copied ? '链接已复制，可以粘贴给其他人。' : '浏览器没有允许自动复制，请从地址栏复制链接。');
    } catch {
      announce('浏览器没有允许自动复制，请从地址栏复制链接。');
    }
  });

  shareButton?.addEventListener('click', async () => {
    if (!navigator.share) {
      copyButton?.click();
      return;
    }

    try {
      await navigator.share({ title, url });
      announce('分享操作已完成。');
    } catch (error) {
      if (error?.name !== 'AbortError') announce('暂时无法打开分享面板，可以改用“复制链接”。');
    }
  });
});
