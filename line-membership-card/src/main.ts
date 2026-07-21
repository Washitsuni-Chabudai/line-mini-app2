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

// 📱 タブ切り替えロジック
function initTabs() {
  const tabItems = document.querySelectorAll('.tab-item');
  tabItems.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');
      if (!targetId) return;

      // すべてのタブとビューのactiveを解除
      document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));

      // 選択されたタブとビューにactiveを付与
      tab.classList.add('active');
      document.getElementById(targetId)?.classList.add('active');
    });
  });
}

async function handleCheckin() {
  sendClientLog('click_checkin_button');
  
  if (!liff.isLoggedIn()) {
    alert('ログインが必要です。');
    return;
  }

  try {
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
  initTabs(); // タブ切り替えの初期化

  const { checkinBtn } = getElements();
  checkinBtn?.addEventListener('click', handleCheckin);

  if (!LIFF_ID) {
    console.error('LIFF IDが未設定です。');
    return;
  }

  try {
    await liff.init({ liffId: LIFF_ID });

    // 🛡️ LINE外ブラウザ判定
    if (!liff.isInClient()) {
      sendClientLog('opened_outside_line');
      const appEl = document.getElementById('app');
      if (appEl) {
        const liffAppUrl = `https://liff.line.me/${LIFF_ID}`;
        appEl.innerHTML = `
          <div class="line-redirect-container">
            <div class="redirect-icon-wrapper">📱</div>
            <h2 class="redirect-title">LINEアプリからお開きください</h2>
            <p class="redirect-desc">
              このデジタルハイウェイパスは、LINEミニアプリ専用のサービスです。<br>
              お手数ですが、下のボタンよりLINEアプリを開いて再度アクセスしてください。
            </p>
            <a href="${liffAppUrl}" class="btn-line-open">LINEアプリで開く</a>
          </div>
        `;
      }
      return;
    }

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
      liff.login();
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