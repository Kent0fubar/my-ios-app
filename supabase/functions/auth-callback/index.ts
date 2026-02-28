// Supabase Edge Function: auth-callback
// 認証メールリンクからアプリへのリダイレクト中間ページ

// @ts-ignore: Deno is a global in Supabase Edge Functions
Deno.serve(async (req: Request) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': '*',
            },
        });
    }

    const url = new URL(req.url);
    const queryString = url.search || '';
    const appUrlBase = 'bandlink://auth-callback';

    const HTML = '<!DOCTYPE html>' +
        '<html lang="ja">' +
        '<head>' +
        '<meta charset="UTF-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '<title>BandLink</title>' +
        '<style>' +
        'body{margin:0;padding:0;background:#0A0A1F;color:#FFF;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}' +
        '.c{text-align:center;padding:40px;max-width:400px;width:90%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:32px}' +
        '.i{width:80px;height:80px;background:linear-gradient(135deg,#E5C07B,#B9934B);border-radius:40px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:40px}' +
        'h1{font-size:24px;font-weight:800;margin-bottom:16px}' +
        'p{color:#A0A0C0;font-size:16px;line-height:1.6;margin-bottom:32px}' +
        '.b{display:inline-block;background:linear-gradient(135deg,#E5C07B,#B9934B);color:#1A1A1E;padding:18px 36px;border-radius:18px;text-decoration:none;font-weight:800;font-size:16px}' +
        '.s{margin-top:24px;font-size:12px;color:#6B6B8D}' +
        '</style>' +
        '</head>' +
        '<body>' +
        '<div class="c">' +
        '<div class="i">&#x1F511;</div>' +
        '<h1>BandLink</h1>' +
        '<p>&#x4E0B;&#x306E;&#x30DC;&#x30BF;&#x30F3;&#x3092;&#x30BF;&#x30C3;&#x30D7;&#x3057;&#x3066;&#x30A2;&#x30D7;&#x30EA;&#x306B;&#x623B;&#x3063;&#x3066;&#x304F;&#x3060;&#x3055;&#x3044;&#x3002;</p>' +
        '<a href="' + appUrlBase + queryString + '" id="b" class="b">&#x30A2;&#x30D7;&#x30EA;&#x3092;&#x958B;&#x304F;</a>' +
        '<div class="s"><p>&#x30DC;&#x30BF;&#x30F3;&#x304C;&#x53CD;&#x5FDC;&#x3057;&#x306A;&#x3044;&#x5834;&#x5408;&#x306F;&#x30A2;&#x30D7;&#x30EA;&#x3092;&#x624B;&#x52D5;&#x3067;&#x8D77;&#x52D5;&#x3057;&#x3066;&#x304F;&#x3060;&#x3055;&#x3044;&#x3002;</p></div>' +
        '</div>' +
        '<script>' +
        'var h=window.location.hash||"";' +
        'var u="' + appUrlBase + queryString + '"+h;' +
        'document.getElementById("b").href=u;' +
        'setTimeout(function(){window.location.replace(u)},500);' +
        '</script>' +
        '</body>' +
        '</html>';

    const headers = new Headers();
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('cache-control', 'no-cache, no-store, must-revalidate');

    return new Response(HTML, {
        status: 200,
        headers: headers,
    });
});
