import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID || '';

// --- UI制御・拡張機能 ---

// 各ボタン要素を確実に取得してイベントを登録する方式
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
        // テーマクラスをボディに適用
        document.body.className = t.className;
        if (t.className === 'theme-night') {
          document.body.classList.add('theme-night-body');
        } else {
          document.body.classList.remove('theme-night-body');
        }

        // アクティブボタンの切り替え
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
  if (!response.ok) throw new Error('バックエンド認証に失敗しました');
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
      }
    } else {
      if (!liff.isInClient()) liff.login();
    }
  } catch (error: any) {
    console.error('LINEミニアプリ起動エラー:', error);
    sendClientLog('app_start_failed', { message: error?.message || String(error) });
  }
}

// DOMの読み込みが完了してからアプリを起動するよう安全にラップ
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}