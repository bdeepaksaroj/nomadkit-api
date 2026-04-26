import { Schema, model, models } from 'mongoose'

const SubscriptionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  paypalSubId: {
    type: String,
    required: true,
    unique: true,
  },
plan: {
  type: String,
  enum: ['free', 'pro', 'chat'],
  default: 'free',
},
  currentPeriodEnd: {
    type: Date,
    required: true,
  },
  cancelledAt: {
    type: Date,
  },
}, { timestamps: true })

export const Subscription = models.Subscription || model('Subscription', SubscriptionSchema)