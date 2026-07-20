// Vercel Serverless Function 用の型定義（Node.js環境）
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // POSTメソッド以外のアクセスを拒否
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. ヘッダーから ID Token を抽出
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '認証トークン（ID Token）が存在しません' });
    }

    const idToken = authHeader.split(' ')[1];
    const channelId = process.env.VITE_LIFF_ID ? process.env.VITE_LIFF_ID.split('-')[0] : '';

    // 2. LINE公式のID Token検証エンドポイントへ問い合わせ
    const params = new URLSearchParams();
    params.append('id_token', idToken);
    params.append('client_id', channelId); // LIFF IDのハイフンより前の数字（チャネルID）

    const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok) {
      console.error('LINE検証エラー:', verifyData);
      return res.status(400).json({ error: '無効なID Tokenです', details: verifyData });
    }

    // 3. 検証成功：安全に確認されたユーザー情報を返却
    // ※実務ではここでデータベース（DB）と照合し、会員データの取得や作成を行います
    return res.status(200).json({
      message: '認証に成功しました',
      user: {
        userId: verifyData.sub,        // LINEのユーザーID
        displayName: verifyData.name,  // 表示名
        pictureUrl: verifyData.picture // プロフィール画像URL
      }
    });

  } catch (error) {
    console.error('サーバー内部エラー:', error);
    return res.status(500).json({ error: 'サーバー内部でエラーが発生しました' });
  }
}