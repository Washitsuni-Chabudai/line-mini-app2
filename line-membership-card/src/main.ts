import liff from '@line/liff';

// 環境変数の取得
const LIFF_ID = import.meta.env.VITE_LIFF_ID || '';

// 画面要素の取得ヘルパー関数
function getElements() {
  return {
    displayName: document.getElementById('displayName'),
    pictureUrl: document.getElementById('pictureUrl') as HTMLImageElement | null,
  };
}

/**
 * フロントエンドの操作ログをバックエンド（Vercel）へ送信する関数
 */
async function sendClientLog(action: string, details?: Record<string, any>) {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, details }),
    });
  } catch (err) {
    console.error('ログ送信エラー:', err);
  }
}

/**
 * ★追加: バックエンド（api/login.ts）へ ID Token を送信して認証・ログ記録を行う関数
 */
async function authenticateWithBackend(idToken: string) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('バックエンド認証に失敗しました');
  }

  return await response.json();
}

/**
 * 画面の表示状態（ローディング/成功/エラー）を一括コントロールする関数
 */
function updateUIState(state: 'loading' | 'success' | 'error', errorMessage?: string) {
  const { displayName } = getElements();

  if (state === 'loading') {
    if (displayName) displayName.textContent = '読み込み中...';
  } else if (state === 'error') {
    if (displayName) {
      displayName.innerHTML = `
        <div style="color: #e53e3e; margin-bottom: 8px;">${errorMessage || 'エラーが発生しました'}</div>
        <button id="retryBtn" style="padding: 6px 12px; background: #06C755; color: white; border: none; border-radius: 4px; cursor: pointer;">
          再試行する
        </button>
      `;

      document.getElementById('retryBtn')?.addEventListener('click', () => {
        sendClientLog('click_retry_button', { reason: errorMessage });
        location.reload();
      });
    }
  }
}

/**
 * LINEミニアプリのメイン起動処理
 */
async function startApp() {
  sendClientLog('app_start_initiated');
  updateUIState('loading');

  if (!LIFF_ID) {
    console.error('LIFF IDが未設定です。');
    sendClientLog('liff_id_missing');
    updateUIState('error', '設定エラー：LIFF IDが見つかりません');
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

      sendClientLog('profile_loaded_success', {
        userId: profile.userId,
        displayName: profile.displayName,
      });

      // ★追加: LINEからID Tokenを取得し、バックエンド（api/login.ts）へ送信
      const idToken = liff.getIDToken();
      if (idToken) {
        await authenticateWithBackend(idToken);
      } else {
        sendClientLog('id_token_missing');
      }

    } else {
      sendClientLog('user_not_logged_in');
      if (!liff.isInClient()) {
        sendClientLog('login_redirect_initiated');
        liff.login();
      }
    }
  } catch (error: any) {
    console.error('LINEミニアプリ起動エラー:', error);
    sendClientLog('app_start_failed', { message: error?.message || String(error) });
    updateUIState('error', '通信に失敗しました。電波状況をご確認ください。');
  }
}

// アプリの起動実行
startApp();