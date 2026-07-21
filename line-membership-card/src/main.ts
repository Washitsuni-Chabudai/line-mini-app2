import './style.css';
import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID || '';

function getElements() {
  return {
    displayName: document.getElementById('displayName'),
    pictureUrl: document.getElementById('pictureUrl') as HTMLImageElement | null,
    checkinBtn: document.getElementById('checkinBtn'),
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

// 📍 チェックインメッセージ送信処理 (`liff.sendMessages` の実装)
async function handleCheckin() {
  sendClientLog('click_checkin_button');
  
  if (!liff.isLoggedIn()) {
    alert('ログインが必要です。');
    return;
  }

  // PCブラウザでのテスト時はシミュレーション動作にする
  if (!liff.isInClient()) {
    alert('【シミュレーション】尼崎PAへのチェックイン報告メッセージを送信しました！（※PCブラウザテスト中のため実際のトーク送信はスキップされます）');
    return;
  }

  try {
    // ユーザーが起動しているチャットルームへメッセージを自動送信
    await liff.sendMessages([
      {
        type: 'text',
        text: '【チェックイン報告】\n名神高速 尼崎PAにてデジタルハイウェイパスを利用しました！安全運転で走行中です。'
      }
    ]);
    alert('✅ 尼崎PAへのチェックインをトークルームに送信しました！');
    sendClientLog('checkin_success');
  } catch (error: any) {
    console.error('メッセージ送信失敗:', error);
    alert('メッセージの送信に失敗しました: ' + (error?.message || error));
    sendClientLog('checkin_failed', { error: error?.message });
  }
}

async function startApp() {
  sendClientLog('app_start_initiated');

  const { checkinBtn } = getElements();
  checkinBtn?.addEventListener('click', handleCheckin);

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