import mongoose, { Schema, Document } from 'mongoose';

export interface IAirdropRecipient {
  userId: mongoose.Types.ObjectId;
  email: string;
  name: string;
  amount: number;
}

export interface IAirdropLog extends Document {
  campaignName: string;
  targetAudience: 'random' | 'active_traders' | 'all_users' | 'top_traders' | 'custom';
  amountPerUser: number;
  recipientCount: number;
  totalDistributed: number;
  note?: string;
  recipients: IAirdropRecipient[];
  executedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const airdropLogSchema = new Schema(
  {
    campaignName: { type: String, required: true },
    targetAudience: {
      type: String,
      enum: ['random', 'active_traders', 'all_users', 'top_traders', 'custom'],
      default: 'random',
    },
    amountPerUser: { type: Number, required: true },
    recipientCount: { type: Number, required: true },
    totalDistributed: { type: Number, required: true },
    note: { type: String, default: '' },
    recipients: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        email: { type: String },
        name: { type: String },
        amount: { type: Number },
      },
    ],
    executedBy: { type: String, default: 'Admin' },
  },
  {
    timestamps: true,
  }
);

const AirdropLog = mongoose.model<IAirdropLog>('AirdropLog', airdropLogSchema);
export default AirdropLog;
