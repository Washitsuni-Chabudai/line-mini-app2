import liff from '@line/liff';

// 金庫（.env）から安全にIDを読み出す記述
const LIFF_ID = import.meta.env.VITE_LIFF_ID || '';

async function startApp() {
  try {
    // 1. LINEのインカム（LIFF）を起動する（必ず「init」にします）
    await liff.init({ liffId: LIFF_ID });

    // 2. すでにLINE内でログインされているか確認
    if (liff.isLoggedIn()) {
      // 3. LINEからユーザーの「名前」や「写真」のデータを貰う
      const profile = await liff.getProfile();
      
      // 4. 画面（HTML）の文字と画像を、LINEのデータに書き換える
      const nameElement = document.getElementById('displayName');
      const pictureElement = document.getElementById('pictureUrl') as HTMLImageElement;

      if (nameElement) {
        nameElement.textContent = profile.displayName; // 名前を反映
      }
      if (pictureElement && profile.pictureUrl) {
        pictureElement.src = profile.pictureUrl; // アイコン写真を反映
      }
    } else {
      // もし普通のブラウザで開かれた場合は、LINEのログイン画面を出す
      liff.login();
    }
  } catch (error) {
    console.error('LINEのデータ読み込みに失敗しました:', error);
    const nameElement = document.getElementById('displayName');
    if (nameElement) nameElement.textContent = 'エラーが発生しました';
  }
}

// アプリを動かす
startApp();