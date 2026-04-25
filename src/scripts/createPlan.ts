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
  console.log('Token response:', JSON.stringify(data, null, 2))
  return data.access_token
}

async function createProduct(token: string) {
  const base = 'https://api-m.sandbox.paypal.com'

  const response = await fetch(`${base}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'NomadKit Pro',
      description: 'Travel companion app with 194 countries',
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  })

  const data = await response.json() as any
  console.log('Product response:', JSON.stringify(data, null, 2))
  return data.id
}

async function createPlan(token: string, productId: string) {
  const base = 'https://api-m.sandbox.paypal.com'

  const response = await fetch(`${base}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name: 'NomadKit Pro Monthly',
      description: 'Monthly subscription to NomadKit Pro',
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: {
            interval_unit: 'MONTH',
            interval_count: 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: '4.99',
              currency_code: 'USD',
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    }),
  })

  const data = await response.json() as any
  console.log('Plan response:', JSON.stringify(data, null, 2))
  return data.id
}

async function main() {
  console.log('Creating PayPal subscription plan...')
  const token = await getAccessToken()
  if (!token) { console.error('Failed to get token'); process.exit(1) }
  const productId = await createProduct(token)
  if (!productId) { console.error('Failed to create product'); process.exit(1) }
  const planId = await createPlan(token, productId)
  console.log('\nPlan ID:', planId)
  process.exit(0)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})