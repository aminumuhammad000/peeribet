import mongoose, { Schema, Document } from 'mongoose';

export interface IWinReceiptShare extends Document {
  user: mongoose.Types.ObjectId;
  tradeId: string;
  tradeType: string;
  profitAmount: number;
  bonusAmount: number;
  platform?: string;
  sharedAt: Date;
}

const winReceiptShareSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tradeId: { type: String, required: true, unique: true }, // Rule 5: Cannot share same receipt twice
    tradeType: { type: String, default: 'trade' },
    profitAmount: { type: Number, default: 0 },
    bonusAmount: { type: Number, default: 1000 }, // Rule 3: 1,000 bonus
    platform: { type: String, default: 'social_share' },
    sharedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index for querying user's recent shares in the last 7 days (Rule 4: 3 shares per week)
winReceiptShareSchema.index({ user: 1, sharedAt: -1 });

const WinReceiptShare = mongoose.model<IWinReceiptShare>('WinReceiptShare', winReceiptShareSchema);
export default WinReceiptShare;
