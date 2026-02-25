// @ts-ignore: Deno is a global in Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// @ts-ignore: Deno is a global in Supabase Edge Functions
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
// @ts-ignore: Deno is a global in Supabase Edge Functions
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// @ts-ignore: Deno is a global in Supabase Edge Functions
Deno.serve(async (req: Request) => {
  try {
    // 認証（RevenueCat の Webhook Auth Header を設定している場合）
    // const authHeader = req.headers.get('Authorization')
    // if (authHeader !== `Bearer ${Deno.env.get('REVENUECAT_WEBHOOK_AUTH_TOKEN')}`) {
    //   return new Response('Unauthorized', { status: 401 })
    // }

    const body = await req.json()
    const { event } = body

    if (!event) {
      return new Response('No event data', { status: 400 })
    }

    const userId = event.app_user_id
    const type = event.type
    const entitlementIds = event.entitlement_ids || []

    console.log(`[RevenueCat Webhook] User: ${userId}, Event: ${type}, Entitlements: ${entitlementIds}`)

    if (!userId) {
      return new Response('No user ID', { status: 200 }) // RevenueCat に成功を返す（リトライ防止）
    }

    // 更新データの準備
    const isPremium = entitlementIds.includes('premium') || entitlementIds.includes('pro')
    const isPro = entitlementIds.includes('pro')

    // 有効期限の取得（ミリ秒単位を ISO 形式に変換）
    const expirationMs = event.expiration_at_ms
    const expiresAt = expirationMs ? new Date(expirationMs).toISOString() : null
    const startedAt = event.purchased_at_ms ? new Date(event.purchased_at_ms).toISOString() : null

    // プロフィール更新
    const { error } = await supabase
      .from('profiles')
      .update({
        is_premium: isPremium,
        is_pro: isPro,
        subscription_started_at: startedAt,
        subscription_expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('[RevenueCat Webhook] DB Update Error:', error)
      return new Response('Database error', { status: 500 })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[RevenueCat Webhook] Unexpected Error:', err)
    return new Response('Internal error', { status: 500 })
  }
})
