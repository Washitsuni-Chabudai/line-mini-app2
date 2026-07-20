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
      
      // ログ追加ポイント⑦: ユーザーが再試行ボタンを押した瞬間
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
  // ログ追加ポイント①: アプリ起動開始
  sendClientLog('app_start_initiated');

  // 1. ローディング状態の開始
  updateUIState('loading');

  // 2. LIFF IDの存在チェック
  if (!LIFF_ID) {
    console.error('LIFF IDが未設定です。');
    // ログ追加ポイント②: 設定エラー発生
    sendClientLog('liff_id_missing');
    updateUIState('error', '設定エラー：LIFF IDが見つかりません');
    return;
  }

  try {
    // 3. LIFF初期化
    await liff.init({ liffId: LIFF_ID });
    // ログ追加ポイント③: LIFF初期化成功
    sendClientLog('liff_init_success', { isInClient: liff.isInClient() });

    // 4. ログインチェックとプロフィール取得
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      const { displayName, pictureUrl } = getElements();

      if (displayName) displayName.textContent = profile.displayName;
      if (pictureUrl && profile.pictureUrl) pictureUrl.src = profile.pictureUrl;

      // ログ追加ポイント④: プロフィール表示成功（ユーザー情報を記録）
      sendClientLog('profile_loaded_success', {
        userId: profile.userId,
        displayName: profile.displayName,
      });

    } else {
      // ログ追加ポイント⑤: ログインが必要な状態
      sendClientLog('user_not_logged_in');
      if (!liff.isInClient()) {
        sendClientLog('login_redirect_initiated');
        liff.login();
      }
    }
  } catch (error: any) {
    console.error('LINEミニアプリ起動エラー:', error);
    // ログ追加ポイント⑥: 起動時エラー発生
    sendClientLog('app_start_failed', { message: error?.message || String(error) });
    updateUIState('error', '通信に失敗しました。電波状況をご確認ください。');
  }
}

// アプリの起動実行
startApp();