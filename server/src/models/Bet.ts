import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBet extends Document {
  user: Types.ObjectId;
  match?: Types.ObjectId;
  market?: Types.ObjectId;
  selection: string;
  amount: number;
  potentialPayout: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID';
  odds: number;
  createdAt: Date;
  updatedAt: Date;
}

const betSchema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', index: true },
    market: { type: mongoose.Schema.Types.ObjectId, ref: 'Market', index: true },
    selection: { 
      type: String, 
      required: true 
    },
    amount: { type: Number, required: true },
    potentialPayout: { type: Number, required: true },
    odds: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['PENDING', 'WON', 'LOST', 'VOID'], 
      default: 'PENDING',
      index: true 
    },
  },
  {
    timestamps: true,
  }
);

const Bet = mongoose.model<IBet>('Bet', betSchema);
export default Bet;
