// api/log.ts : フロントエンドからの操作ログを受け取ってVercelログに記録するAPI
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { action, details } = req.body || {};
    const timestamp = new Date().toISOString();

    // 📱 [Frontend Action] という接頭辞をつけてVercelログに出力
    console.log(`📱 [Frontend Action] イベント: ${action} | 日時: ${timestamp}`, details ? JSON.stringify(details) : '');

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ [Log API Error] ログ記録失敗:', error);
    return res.status(500).json({ error: 'Failed to record log' });
  }
}