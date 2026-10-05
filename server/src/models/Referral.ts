import mongoose, { Schema, Document } from 'mongoose';

export interface IReferral extends Document {
  referrer: mongoose.Types.ObjectId;
  referee: mongoose.Types.ObjectId;
  referralCode: string;
  referrerBonus: number;
  refereeBonus: number;
  status: 'pending' | 'completed' | 'rewarded';
  rewardedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema(
  {
    referrer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referee: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    referralCode: { type: String, required: true, uppercase: true, trim: true },
    referrerBonus: { type: Number, default: 1000 },
    refereeBonus: { type: Number, default: 1000 },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'rewarded'], 
      default: 'rewarded' 
    },
    rewardedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

referralSchema.index({ referralCode: 1 });
referralSchema.index({ createdAt: -1 });

const Referral = mongoose.model<IReferral>('Referral', referralSchema);
export default Referral;
