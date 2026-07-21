/// <reference path="./global.d.ts" />

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './style.css'; // 📌 忘れずにCSSをインポートする
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);