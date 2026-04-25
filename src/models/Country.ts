import { Schema, model, models } from 'mongoose'

const CountrySchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  flag: { type: String },
  emergency: { type: Schema.Types.Mixed },
  food: { type: Schema.Types.Mixed },
  scams: { type: Schema.Types.Mixed },
  transport: { type: Schema.Types.Mixed },
  visa: { type: Schema.Types.Mixed },
}, { timestamps: true })

CountrySchema.index({ name: 'text' })
CountrySchema.index({ code: 1 })

export const Country = models.Country || model('Country', CountrySchema)