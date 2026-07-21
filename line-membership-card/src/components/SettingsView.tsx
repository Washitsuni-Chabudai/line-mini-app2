import React from 'react';

export const SettingsView: React.FC = () => {
  return (
    <div className="panel-card">
      <h2 className="panel-title">⚙️ アカウント設定</h2>
      <p className="panel-subtitle">車両情報や通知設定の管理を行います。</p>

      <div className="settings-group">
        <div className="settings-row">
          <span>プッシュ通知</span>
          <span className="settings-val">有効</span>
        </div>
        <div className="settings-row">
          <span>車両変更申請</span>
          <span className="settings-link" onClick={() => alert('車両変更フォームへ移動します')}>変更する ＞</span>
        </div>
        <div className="settings-row">
          <span>利用規約 / プライバシー</span>
          <span className="settings-link" onClick={() => alert('利用規約ページを表示します')}>確認する ＞</span>
        </div>
      </div>
    </div>
  );
};