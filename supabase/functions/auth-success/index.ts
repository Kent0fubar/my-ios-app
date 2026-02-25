// Supabase Edge Function: auth-success
// 認証成功時の中間ランディングページ

// @ts-ignore: Deno is a global in Supabase Edge Functions
Deno.serve(async (req: Request) => {
    const url = new URL(req.url);
    // クエリパラメータからアプリのスキームを取得（デフォルトは bandlink）
    const scheme = url.searchParams.get('scheme') || 'bandlink';
    const appUrl = `${scheme}://login`;

    const HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>認証成功 | BandLink</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #0A0A1F;
            color: #FFFFFF;
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
        }
        .container {
            text-align: center;
            padding: 40px;
            max-width: 400px;
            width: 90%;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 32px;
            backdrop-filter: blur(20px);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        }
        .icon-circle {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #E5C07B, #B9934B);
            border-radius: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            box-shadow: 0 10px 20px rgba(229, 192, 123, 0.3);
        }
        .icon-check {
            color: #1A1A1E;
            font-size: 40px;
            font-weight: bold;
        }
        h1 {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 16px;
            letter-spacing: -0.5px;
        }
        p {
            color: #A0A0C0;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 32px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #E5C07B, #B9934B);
            color: #1A1A1E;
            padding: 18px 36px;
            border-radius: 18px;
            text-decoration: none;
            font-weight: 800;
            font-size: 16px;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 15px rgba(229, 192, 123, 0.2);
        }
        .button:active {
            transform: scale(0.96);
        }
        .troubleshoot {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 13px;
            color: #6B6B8D;
            text-align: left;
        }
        .troubleshoot summary {
            cursor: pointer;
            text-align: center;
            color: #A0A0C0;
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon-circle">
            <span class="icon-check">✓</span>
        </div>
        <h1>認証が完了しました！</h1>
        <p>BandLinkのアカウントが有効になりました。下のボタンを押してアプリに戻り、ログインしてください。</p>
        <a href="${appUrl}" class="button">アプリを開く</a>
        
        <details class="troubleshoot">
            <summary>アプリが開けない場合</summary>
            <p>1. iPhone の <b>Safari</b> でこのページを開いているか確認してください。</p>
            <p>2. アプリがインストールされているか確認してください。</p>
            <p>3. 以下のリンクをコピーして Safari のアドレスバーに貼り付けてください：<br>
               <code>${appUrl}</code></p>
        </details>

        <div style="margin-top: 24px; font-size: 12px; color: #6B6B8D;">
            © 2026 BandLink
        </div>
    </div>
    <script>
        // スマホの場合、2秒後に自動的にアプリを開く試み
        setTimeout(() => {
            window.location.replace("${appUrl}");
        }, 2000);
    </script>
</body>
</html>`;

    const encoder = new TextEncoder();
    const body = encoder.encode(HTML);

    return new Response(body, {
        status: 200,
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-Content-Type-Options": "nosniff"
        },
    });
});
