import React from 'react';

interface CardViewProps {
  displayName: string;
  pictureUrl: string;
  onCheckin: () => void;
}

export const CardView: React.FC<CardViewProps> = ({ displayName, pictureUrl, onCheckin }) => {
  return (
    <div className="membership-card">
      <div className="card-header">
        <div className="brand-title">
          <span className="logo-mark">🛣️</span> DIGITAL HIGHWAY PASS
        </div>
        <span className="status-badge">認証済み</span>
      </div>

      <div className="profile-area">
        <img src={pictureUrl || 'https://via.placeholder.com/80'} alt="プロフィール画像" className="profile-img" />
        <div className="profile-info">
          <p className="greeting">マイアカウント</p>
          <h2>{displayName}</h2>
        </div>
      </div>

      <div className="qr-area">
        <p className="qr-hint">係員またはリーダーにかざしてください</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=HANSHIN_CHECKIN_SECURE_TOKEN" alt="会員QRコード" className="qr-img"/>
      </div>

      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">連携ETCカード</span>
          <span className="info-value">****-****-****-5678</span>
        </div>
        <div className="info-item">
          <span className="info-label">登録車両</span>
          <span className="info-value">阪神 300 あ 12-34</span>
        </div>
        <div className="info-item">
          <span className="info-label">割引ステータス</span>
          <span className="info-value highlight">適用中 (マイレージ)</span>
        </div>
      </div>

      <div className="action-area">
        <button onClick={onCheckin} className="btn-primary">
          📍 尼崎PAにチェックイン報告する
        </button>
      </div>
    </div>
  );
};