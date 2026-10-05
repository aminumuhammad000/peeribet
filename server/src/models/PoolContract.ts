import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPoolContract extends Document {
  user: Types.ObjectId;
  match?: Types.ObjectId;
  predictionMarket?: Types.ObjectId;
  market: string;
  selection: string;
  stake: number;
  isBridged: boolean;
  originalP2POrderId?: Types.ObjectId;
  status: 'PENDING' | 'WON' | 'LOST' | 'REFUNDED';
  proRataShare: number;
  payout: number;
  surplus: number;
  feeDeducted: number;
  payoutType?: 'PRO_RATA' | 'DOUBLE_BRIDGE' | 'SAFETY_VALVE';
  createdAt: Date;
  updatedAt: Date;
}

const poolContractSchema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    predictionMarket: { type: mongoose.Schema.Types.ObjectId, ref: 'Market' },
    market: {
      type: String,
      default: 'MATCH_OUTCOME',
    },
    selection: {
      type: String,
      required: true,
    },
    stake: { type: Number, required: true, min: 100 },
    isBridged: { type: Boolean, default: false },
    originalP2POrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'P2POrder' },
    status: {
      type: String,
      enum: ['PENDING', 'WON', 'LOST', 'REFUNDED'],
      default: 'PENDING',
    },
    proRataShare: { type: Number, default: 0 },
    payout: { type: Number, default: 0 },
    surplus: { type: Number, default: 0 },
    feeDeducted: { type: Number, default: 0 },
    payoutType: {
      type: String,
      enum: ['PRO_RATA', 'DOUBLE_BRIDGE', 'SAFETY_VALVE'],
    },
  },
  {
    timestamps: true,
  }
);

poolContractSchema.index({ match: 1, selection: 1, status: 1 });
poolContractSchema.index({ predictionMarket: 1, selection: 1, status: 1 });
poolContractSchema.index({ user: 1, status: 1 });

const PoolContract = mongoose.model<IPoolContract>('PoolContract', poolContractSchema);
export default PoolContract;
