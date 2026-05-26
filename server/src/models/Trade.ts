import mongoose, { Schema, Document } from 'mongoose';

export interface ITrade extends Document {
  initiator: mongoose.Schema.Types.ObjectId;
  responder: mongoose.Schema.Types.ObjectId;
  amount: number;
  status: 'PENDING' | 'SETTLED' | 'BLOCKED' | 'CANCELED';
  createdAt: Date;
  updatedAt: Date;
}

const tradeSchema = new Schema(
  {
    initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['PENDING', 'SETTLED', 'BLOCKED', 'CANCELED'], 
      default: 'PENDING' 
    },
  },
  {
    timestamps: true,
  }
);

const Trade = mongoose.model<ITrade>('Trade', tradeSchema);
export default Trade;
