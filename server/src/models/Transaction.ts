import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  type: 'deposit' | 'withdrawal' | 'bet_placed' | 'bet_won' | 'bet_lost' | 'referral_bonus';
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
      enum: ['deposit', 'withdrawal', 'bet_placed', 'bet_won', 'bet_lost', 'referral_bonus'], 
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
