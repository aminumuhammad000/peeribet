import mongoose, { Schema, Document } from 'mongoose';

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'bet_placed'
  | 'bet_won'
  | 'bet_lost'
  | 'referral_bonus'
  | 'p2p_order_placed'
  | 'p2p_trade_won'
  | 'p2p_order_cancelled'
  | 'p2p_unmatched_refund'
  | 'pool_entry_placed'
  | 'pool_jackpot_won'
  | 'bridge_pool_won'
  | 'bridge_liquidity_converted';

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
      type: String, 
      enum: [
        'deposit',
        'withdrawal',
        'bet_placed',
        'bet_won',
        'bet_lost',
        'referral_bonus',
        'p2p_order_placed',
        'p2p_trade_won',
        'p2p_order_cancelled',
        'p2p_unmatched_refund',
        'pool_entry_placed',
        'pool_jackpot_won',
        'bridge_pool_won',
        'bridge_liquidity_converted',
      ], 
      required: true 
    },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    reference: { type: String, required: true, unique: true },
    description: { type: String },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
export default Transaction;
