import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID || '';

function getElements() {
  return {
    displayName: document.getElementById('displayName'),
    pictureUrl: document.getElementById('pictureUrl') as HTMLImageElement | null,
  };
}

async function sendClientLog(action: string, details?: Record<string, any>) {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details }),
    });
  } catch (err) {
    console.error('ログ送信エラー:', err);
  }
}

async function authenticateWithBackend(idToken: string) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`バックエンド認証失敗 [Status: ${response.status}] 内容: ${errorText}`);
  }
  return await response.json();
}

async function startApp() {
  sendClientLog('app_start_initiated');

  if (!LIFF_ID) {
    console.error('LIFF IDが未設定です。');
    return;
  }

  try {
    await liff.init({ liffId: LIFF_ID });

    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      const { displayName, pictureUrl } = getElements();

      if (displayName) displayName.textContent = profile.displayName;
      if (pictureUrl && profile.pictureUrl) pictureUrl.src = profile.pictureUrl;

      const idToken = liff.getIDToken();
      if (idToken) {
        await authenticateWithBackend(idToken);
      }
    } else {
      if (!liff.isInClient()) {
        const { displayName } = getElements();
        if (displayName) displayName.textContent = 'テストユーザー (ゲスト)';
      } else {
        liff.login();
      }
    }
  } catch (error: any) {
    console.error('LINEミニアプリ起動エラー:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}