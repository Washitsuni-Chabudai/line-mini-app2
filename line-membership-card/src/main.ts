import liff from '@line/liff';

// 金庫（.envまたはVercelの環境変数）から安全にIDを読み出す
const LIFF_ID = import.meta.env.VITE_LINE_LIFF_ID || '';

async function startApp() {
  // 1. 環境変数が空の場合は事前にエラーを防ぐ
  if (!LIFF_ID) {
    console.error('LIFF IDが設定されていません。.env または Vercelの設定を確認してください。');
    showError('LIFF IDが設定されていません');
    return;
  }

  try {
    // 2. 過去コードと同じ正しい初期化手順
    await liff.init({ liffId: LIFF_ID });

    // 3. ログイン状態の確認とプロフィール取得
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      
      const nameElement = document.getElementById('displayName');
      const pictureElement = document.getElementById('pictureUrl') as HTMLImageElement;

      if (nameElement) nameElement.textContent = profile.displayName;
      if (pictureElement && profile.pictureUrl) pictureElement.src = profile.pictureUrl;
    } else {
      // LINEアプリ外で開かれた場合のみログインを促す（安全な判定）
      if (!liff.isInClient()) {
        liff.login();
      }
    }
  } catch (error) {
    console.error('LINE初期化エラー:', error);
    showError('エラーが発生しました');
  }
}

// 画面にエラーを表示する共通関数
function showError(message: string) {
  const nameElement = document.getElementById('displayName');
  if (nameElement) nameElement.textContent = message;
}

// アプリ起動
startApp();