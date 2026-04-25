import { Request, Response } from 'express'
import { connectDB } from '../lib/mongodb'
import { Subscription } from '../models/Subscription'
import { getSubscription, cancelSubscription } from '../lib/paypal'

export async function createSubscription(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    const { subscriptionId } = req.body

    if (!subscriptionId) {
      res.status(400).json({ error: 'subscriptionId is required' })
      return
    }

    const paypalSub = await getSubscription(subscriptionId) as any

    if (paypalSub.status !== 'ACTIVE') {
      res.status(400).json({ error: 'Subscription is not active' })
      return
    }

    await connectDB()

    const existing = await Subscription.findOne({ userId })
    if (existing) {
      existing.paypalSubId = subscriptionId
      existing.status = 'active'
      existing.currentPeriodEnd = new Date(paypalSub.billing_info.next_billing_time)
      await existing.save()
    } else {
      await Subscription.create({
        userId,
        paypalSubId: subscriptionId,
        status: 'active',
        currentPeriodEnd: new Date(paypalSub.billing_info.next_billing_time),
      })
    }

    res.json({ message: 'Subscription activated successfully' })
  } catch (error) {
    console.error('createSubscription error:', error)
    res.status(500).json({ error: 'Failed to activate subscription' })
  }
}

export async function getSubscriptionStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    await connectDB()

    const subscription = await Subscription.findOne({ userId })

    if (!subscription) {
      res.json({ subscribed: false })
      return
    }

    const isActive = subscription.status === 'active' &&
      new Date(subscription.currentPeriodEnd) > new Date()

    res.json({
      subscribed: isActive,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
    })
  } catch (error) {
    console.error('getSubscriptionStatus error:', error)
    res.status(500).json({ error: 'Failed to get subscription status' })
  }
}

export async function cancelUserSubscription(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    await connectDB()

    const subscription = await Subscription.findOne({ userId })
    if (!subscription) {
      res.status(404).json({ error: 'No active subscription found' })
      return
    }

    const cancelled = await cancelSubscription(
      subscription.paypalSubId,
      'User requested cancellation'
    )

    if (cancelled) {
      subscription.status = 'cancelled'
      subscription.cancelledAt = new Date()
      await subscription.save()
      res.json({ message: 'Subscription cancelled successfully' })
    } else {
      res.status(500).json({ error: 'Failed to cancel subscription with PayPal' })
    }
  } catch (error) {
    console.error('cancelSubscription error:', error)
    res.status(500).json({ error: 'Failed to cancel subscription' })
  }
}

export async function webhookHandler(req: Request, res: Response) {
  try {
    const event = req.body
    const eventType = event.event_type

    console.log('PayPal webhook:', eventType)

    await connectDB()

    if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const subId = event.resource.id
      await Subscription.findOneAndUpdate(
        { paypalSubId: subId },
        { status: 'active' }
      )
    }

    if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ||
        eventType === 'BILLING.SUBSCRIPTION.EXPIRED') {
      const subId = event.resource.id
      await Subscription.findOneAndUpdate(
        { paypalSubId: subId },
        { status: 'cancelled', cancelledAt: new Date() }
      )
    }

    if (eventType === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED') {
      const subId = event.resource.id
      await Subscription.findOneAndUpdate(
        { paypalSubId: subId },
        { status: 'past_due' }
      )
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}