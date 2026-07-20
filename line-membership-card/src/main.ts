import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID || '';

// --- UI制御・拡張機能 ---

function setupThemeSwitcher() {
  const themes = [
    { id: 'btnCard', className: 'theme-card' },
    { id: 'btnSign', className: 'theme-sign' },
    { id: 'btnWallet', className: 'theme-wallet' },
    { id: 'btnNight', className: 'theme-night' },
    { id: 'btnCockpit', className: 'theme-cockpit' },
  ];

  themes.forEach(t => {
    const btn = document.getElementById(t.id);
    if (btn) {
      btn.addEventListener('click', () => {
        document.body.className = t.className;
        if (t.className === 'theme-night') {
          document.body.classList.add('theme-night-body');
        } else {
          document.body.classList.remove('theme-night-body');
        }

        document.querySelectorAll('.theme-switcher button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        sendClientLog('theme_changed', { theme: t.className });
      });
    }
  });
}

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
  setupThemeSwitcher();
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
      } else {
        console.warn('⚠️ IDトークンが取得できないため、バックエンド認証をスキップしました（PCブラウザテスト中）');
      }
    } else {
      if (!liff.isInClient()) {
        console.warn('⚠️ LINEログイン未完了のため、ログインをスキップしてUIテストモードで動作します');
        // PCブラウザでのUIテストをしやすくするため、未ログイン時はダミー名を表示
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