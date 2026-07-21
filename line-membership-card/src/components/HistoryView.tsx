import React from 'react';

export const HistoryView: React.FC = () => {
  return (
    <div className="panel-card">
      <h2 className="panel-title">🚗 走行・利用履歴</h2>
      <p className="panel-subtitle">直近のハイウェイパス利用状況です。</p>

      <div className="history-list">
        <div className="history-item">
          <div>
            <div className="history-date">2026/07/21 08:30</div>
            <div className="history-detail">
              <span className="route">名神高速 尼崎PA (上り)</span>
            </div>
          </div>
          <span className="status-ok">チェックイン済</span>
        </div>
        <div className="history-item">
          <div>
            <div className="history-date">2026/07/15 17:45</div>
            <div className="history-detail">
              <span className="route">阪神高速 3号神戸線</span>
            </div>
          </div>
          <span className="status-ok">割引適用</span>
        </div>
      </div>
    </div>
  );
};