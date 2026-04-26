import dotenv from 'dotenv'
dotenv.config()

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  const base = 'https://api-m.sandbox.paypal.com'
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })
  const data = await response.json() as any
  return data.access_token as string
}

async function createProduct(token: string, name: string, desc: string) {
  const base = 'https://api-m.sandbox.paypal.com'
  const response = await fetch(`${base}/v1/catalogs/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name, description: desc, type: 'SERVICE', category: 'SOFTWARE' }),
  })
  const data = await response.json() as any
  console.log(`Product created: ${data.id} — ${name}`)
  return data.id
}

async function createPlan(token: string, productId: string, name: string, price: string) {
  const base = 'https://api-m.sandbox.paypal.com'
  const response = await fetch(`${base}/v1/billing/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      product_id: productId,
      name,
      description: name,
      status: 'ACTIVE',
      billing_cycles: [{
        frequency: { interval_unit: 'MONTH', interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { value: price, currency_code: 'USD' } },
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    }),
  })
  const data = await response.json() as any
  console.log(`Plan created: ${data.id} — ${name} @ $${price}/month`)
  return data.id
}

async function main() {
  console.log('Creating PayPal plans...\n')
  const token = await getAccessToken()

  // Plan 1 — Pro $4.99
  const proProductId = await createProduct(token, 'NomadKit Pro', 'All 194 countries, emergency, food, scams, visa, maps, currency')
  const proPlanId = await createPlan(token, proProductId, 'NomadKit Pro Monthly', '4.99')

  // Plan 2 — Pro+Chat $7.99
  const chatProductId = await createProduct(token, 'NomadKit Pro + Chat', 'Everything in Pro plus travel group chats')
  const chatPlanId = await createPlan(token, chatProductId, 'NomadKit Pro + Chat Monthly', '7.99')

  console.log('\n✅ Add these to your .env:')
  console.log(`PAYPAL_PLAN_ID_PRO=${proPlanId}`)
  console.log(`PAYPAL_PLAN_ID_CHAT=${chatPlanId}`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })