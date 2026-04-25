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
  status: {
    type: String,
    enum: ['active', 'cancelled', 'past_due', 'suspended'],
    default: 'active',
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