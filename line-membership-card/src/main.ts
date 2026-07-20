import liff from '@line/liff';

// 環境変数の取得
const LIFF_ID = import.meta.env.VITE_LIFF_ID || '';

// 画面要素の取得ヘルパー関数
function getElements() {
  return {
    displayName: document.getElementById('displayName'),
    pictureUrl: document.getElementById('pictureUrl') as HTMLImageElement | null,
    // HTML側に既存のエラー/表示エリアが存在する前提での共通処理
  };
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
      // 再試行ボタンにイベントを設定
      document.getElementById('retryBtn')?.addEventListener('click', () => {
        location.reload();
      });
    }
  }
}

/**
 * LINEミニアプリのメイン起動処理
 */
async function startApp() {
  // 1. ローディング状態の開始
  updateUIState('loading');

  // 2. LIFF IDの存在チェック
  if (!LIFF_ID) {
    console.error('LIFF IDが未設定です。');
    updateUIState('error', '設定エラー：LIFF IDが見つかりません');
    return;
  }

  try {
    // 3. LIFF初期化（タイムアウト制限を視野に入れた安全な呼び出し）
    await liff.init({ liffId: LIFF_ID });

    // 4. ログインチェックとプロフィール取得
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      const { displayName, pictureUrl } = getElements();

      if (displayName) displayName.textContent = profile.displayName;
      if (pictureUrl && profile.pictureUrl) pictureUrl.src = profile.pictureUrl;

    } else {
      // LINEアプリ外で開かれた場合は安全にログイン誘導
      if (!liff.isInClient()) {
        liff.login();
      }
    }
  } catch (error) {
    console.error('LINEミニアプリ起動エラー:', error);
    updateUIState('error', '通信に失敗しました。電波状況をご確認ください。');
  }
}

// アプリの起動実行
startApp();