import React from 'react';

export const CouponView: React.FC = () => {
  return (
    <div className="panel-card">
      <h2 className="panel-title">🎟️ 利用可能クーポン</h2>
      <p className="panel-subtitle">SA・PAの店舗で使えるお得な優待クーポンです。</p>
      
      <div className="coupon-list">
        <div className="coupon-item">
          <div className="coupon-info">
            <span className="coupon-tag">レストラン</span>
            <h3>お食事代 10%OFF</h3>
            <p>尼崎PAフードコート全店で利用可能</p>
          </div>
          <button className="btn-sub" onClick={() => alert('クーポンコード：HS10OFF をレジでご提示ください')}>詳細</button>
        </div>
        <div className="coupon-item">
          <div className="coupon-info">
            <span className="coupon-tag">物販・お土産</span>
            <h3>名産品 100円割引</h3>
            <p>1,000円以上のお買い上げで適用</p>
          </div>
          <button className="btn-sub" onClick={() => alert('クーポンコード：HS100OFF をレジでご提示ください')}>詳細</button>
        </div>
      </div>
    </div>
  );
};