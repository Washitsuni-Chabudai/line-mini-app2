import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ログ1: リクエスト受信ログ
  console.log('🚀 [Backend Log] APIリクエストを受信しました:', new Date().toISOString());

  if (req.method !== 'POST') {
    console.warn('⚠️ [Backend Log] 不正なHTTPメソッド:', req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ [Backend Log] Authorizationヘッダーが欠落しています');
      return res.status(401).json({ error: '認証トークン（ID Token）が存在しません' });
    }

    const idToken = authHeader.split(' ')[1];
    const channelId = process.env.VITE_LIFF_ID ? process.env.VITE_LIFF_ID.split('-')[0] : '';

    // ログ2: LINE検証API呼び出し直前
    console.log('🔄 [Backend Log] LINE公式サーバーへID Tokenの検証をリクエスト中...');

    const params = new URLSearchParams();
    params.append('id_token', idToken);
    params.append('client_id', channelId);

    const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok) {
      console.error('❌ [Backend Log] LINE検証失敗:', verifyData);
      return res.status(400).json({ error: '無効なID Tokenです', details: verifyData });
    }

    // ログ3: 認証成功ログ（ユーザーIDと表示名を出力）
    console.log(`✅ [Backend Log] 認証成功! ユーザー名: ${verifyData.name} (User ID: ${verifyData.sub})`);

    return res.status(200).json({
      message: '認証に成功しました',
      user: {
        userId: verifyData.sub,
        displayName: verifyData.name,
        pictureUrl: verifyData.picture
      }
    });

  } catch (error) {
    console.error('❌ [Backend Log] サーバー内部エラー例外発生:', error);
    return res.status(500).json({ error: 'サーバー内部でエラーが発生しました' });
  }
}