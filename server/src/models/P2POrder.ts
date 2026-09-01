import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMatchedFill {
  counterpartyOrderId: Types.ObjectId;
  counterpartyUserId: Types.ObjectId;
  shares: number;
  matchedAt: Date;
}

export interface IP2POrder extends Document {
  user: Types.ObjectId;
  match: Types.ObjectId;
  market: 'MATCH_OUTCOME' | 'OVER_UNDER_25' | 'BTTS';
  selection: 'HOME' | 'DRAW' | 'AWAY' | 'OVER_25' | 'UNDER_25' | 'BTTS_YES' | 'BTTS_NO';
  totalShares: number;
  sharePrice: number; // ₦1,000 per share
  totalAmount: number; // totalShares * 1000
  matchedShares: number;
  unmatchedShares: number;
  matchedFills: IMatchedFill[];
  status: 'OPEN' | 'PARTIALLY_MATCHED' | 'MATCHED' | 'BRIDGED' | 'CANCELLED' | 'SETTLED';
  isBridged: boolean;
  bridgedAt?: Date;
  bridgeOffered: boolean;
  bridgeOfferedAt?: Date;
  payout: number;
  grossProfit: number;
  feePaid: number;
  outcomeResult: 'PENDING' | 'WON' | 'LOST' | 'VOID' | 'REFUNDED';
  createdAt: Date;
  updatedAt: Date;
}

const p2pOrderSchema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    market: {
      type: String,
      enum: ['MATCH_OUTCOME', 'OVER_UNDER_25', 'BTTS'],
      default: 'MATCH_OUTCOME',
    },
    selection: {
      type: String,
      enum: ['HOME', 'DRAW', 'AWAY', 'OVER_25', 'UNDER_25', 'BTTS_YES', 'BTTS_NO'],
      required: true,
    },
    totalShares: { type: Number, required: true, min: 1 },
    sharePrice: { type: Number, default: 1000 },
    totalAmount: { type: Number, required: true },
    matchedShares: { type: Number, default: 0 },
    unmatchedShares: { type: Number, required: true },
    matchedFills: [
      {
        counterpartyOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'P2POrder' },
        counterpartyUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        shares: { type: Number, required: true },
        matchedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['OPEN', 'PARTIALLY_MATCHED', 'MATCHED', 'BRIDGED', 'CANCELLED', 'SETTLED'],
      default: 'OPEN',
    },
    isBridged: { type: Boolean, default: false },
    bridgedAt: { type: Date },
    bridgeOffered: { type: Boolean, default: false },
    bridgeOfferedAt: { type: Date },
    payout: { type: Number, default: 0 },
    grossProfit: { type: Number, default: 0 },
    feePaid: { type: Number, default: 0 },
    outcomeResult: {
      type: String,
      enum: ['PENDING', 'WON', 'LOST', 'VOID', 'REFUNDED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

p2pOrderSchema.index({ match: 1, selection: 1, status: 1 });
p2pOrderSchema.index({ user: 1, status: 1 });

const P2POrder = mongoose.model<IP2POrder>('P2POrder', p2pOrderSchema);
export default P2POrder;
