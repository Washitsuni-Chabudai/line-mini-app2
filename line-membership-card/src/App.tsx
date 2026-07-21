import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { CardView } from './components/CardView';
import { CouponView } from './components/CouponView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';

const LIFF_ID = import.meta.env.VITE_LIFF_ID || '';

export function App() {
  const [currentTab, setCurrentTab] = useState<'card' | 'coupon' | 'history' | 'settings'>('card');
  const [displayName, setDisplayName] = useState('読み込み中...');
  const [pictureUrl, setPictureUrl] = useState('');
  const [isOutsideLine, setIsOutsideLine] = useState(false);

  useEffect(() => {
    async function initLiff() {
      if (!LIFF_ID) {
        console.error('LIFF IDが未設定です。');
        return;
      }

      try {
        await liff.init({ liffId: LIFF_ID });

        // LINE外ブラウザ判定
        if (!liff.isInClient()) {
          setIsOutsideLine(true);
          return;
        }

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setDisplayName(profile.displayName);
          if (profile.pictureUrl) setPictureUrl(profile.pictureUrl);

          const idToken = liff.getIDToken();
          if (idToken) {
            await fetch('/api/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
              },
            });
          }
        } else {
          liff.login();
        }
      } catch (error) {
        console.error('LIFF初期化エラー:', error);
      }
    }

    initLiff();
  }, []);

  const handleCheckin = async () => {
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
    } catch (error: any) {
      console.error('メッセージ送信失敗:', error);
      alert('メッセージの送信に失敗しました: ' + (error?.message || error));
    }
  };

  // LINE外ブラウザの場合の表示
  if (isOutsideLine) {
    const liffAppUrl = `https://liff.line.me/${LIFF_ID}`;
    return (
      <div className="line-redirect-container">
        <div className="redirect-icon-wrapper">📱</div>
        <h2 className="redirect-title">LINEアプリからお開きください</h2>
        <p className="redirect-desc">
          このデジタルハイウェイパスは、LINEミニアプリ専用のサービスです。<br />
          お手数ですが、下のボタンよりLINEアプリを開いて再度アクセスしてください。
        </p>
        <a href={liffAppUrl} className="btn-line-open">LINEアプリで開く</a>
      </div>
    );
  }

  return (
    <div>
      {/* 画面切り替え */}
      {currentTab === 'card' && <CardView displayName={displayName} pictureUrl={pictureUrl} onCheckin={handleCheckin} />}
      {currentTab === 'coupon' && <CouponView />}
      {currentTab === 'history' && <HistoryView />}
      {currentTab === 'settings' && <SettingsView />}

      {/* 下部タブバー */}
      <nav className="bottom-tab-bar">
        <button className={`tab-item ${currentTab === 'card' ? 'active' : ''}`} onClick={() => setCurrentTab('card')}>
          <span className="tab-icon">💳</span>
          <span className="tab-label">会員証</span>
        </button>
        <button className={`tab-item ${currentTab === 'coupon' ? 'active' : ''}`} onClick={() => setCurrentTab('coupon')}>
          <span className="tab-icon">🎟️</span>
          <span className="tab-label">クーポン</span>
        </button>
        <button className={`tab-item ${currentTab === 'history' ? 'active' : ''}`} onClick={() => setCurrentTab('history')}>
          <span className="tab-icon">🚗</span>
          <span className="tab-label">履歴</span>
        </button>
        <button className={`tab-item ${currentTab === 'settings' ? 'active' : ''}`} onClick={() => setCurrentTab('settings')}>
          <span className="tab-icon">⚙️</span>
          <span className="tab-label">設定</span>
        </button>
      </nav>
    </div>
  );
}