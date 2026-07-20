import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID || '';

// --- リアルタイム時計 ---
function startSecurityClock() {
  const clockEl = document.getElementById('realtimeClock');
  if (!clockEl) return;
  setInterval(() => {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('ja-JP');
  }, 1000);
}

function getElements() {
  return {
    displayName: document.getElementById('displayName'),
    pictureUrl: document.getElementById('pictureUrl') as HTMLImageElement | null,
    couponBtn: document.getElementById('couponBtn'),
  };
}

// --- 通信・ログ制御 ---

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

// --- メイン起動処理 ---

async function startApp() {
  startSecurityClock();
  sendClientLog('app_start_initiated');

  const { couponBtn } = getElements();
  couponBtn?.addEventListener('click', () => {
    sendClientLog('click_coupon_menu');
    alert('クーポンメニュー画面へ遷移します（機能準備中）');
  });

  if (!LIFF_ID) {
    console.error('LIFF IDが未設定です。');
    sendClientLog('liff_id_missing');
    return;
  }

  try {
    await liff.init({ liffId: LIFF_ID });
    sendClientLog('liff_init_success', { isInClient: liff.isInClient() });

    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      const { displayName, pictureUrl } = getElements();

      if (displayName) displayName.textContent = profile.displayName;
      if (pictureUrl && profile.pictureUrl) pictureUrl.src = profile.pictureUrl;

      sendClientLog('profile_loaded_success', { userId: profile.userId });

      const idToken = liff.getIDToken();
      if (idToken) {
        await authenticateWithBackend(idToken);
      }
    } else {
      if (!liff.isInClient()) {
        const { displayName } = getElements();
        if (displayName) displayName.textContent = 'テストドライバー (ゲスト)';
      } else {
        liff.login();
      }
    }
  } catch (error: any) {
    console.error('LINEミニアプリ起動エラー:', error);
    sendClientLog('app_start_failed', { message: error?.message || String(error) });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}