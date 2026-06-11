import mongoose, { Schema, Document } from 'mongoose';

export interface IBet extends Document {
  user: mongoose.Schema.Types.ObjectId;
  match: mongoose.Schema.Types.ObjectId;
  selection: 'HOME' | 'DRAW' | 'AWAY';
  amount: number;
  potentialPayout: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID';
  odds: number;
}

const betSchema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    selection: { 
      type: String, 
      enum: ['HOME', 'DRAW', 'AWAY'], 
      required: true 
    },
    amount: { type: Number, required: true },
    potentialPayout: { type: Number, required: true },
    odds: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['PENDING', 'WON', 'LOST', 'VOID'], 
      default: 'PENDING' 
    },
  },
  {
    timestamps: true,
  }
);

const Bet = mongoose.model<IBet>('Bet', betSchema);
export default Bet;
