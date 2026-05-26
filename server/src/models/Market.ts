import mongoose, { Schema, Document } from 'mongoose';

export interface IMarket extends Document {
  pair: string;
  rate: number;
  change: string;
  volume: string;
  status: 'ACTIVE' | 'MAINTENANCE';
}

const marketSchema = new Schema(
  {
    pair: { type: String, required: true, unique: true },
    rate: { type: Number, required: true },
    change: { type: String, default: '0.0%' },
    volume: { type: String, default: '₦0' },
    status: { 
      type: String, 
      enum: ['ACTIVE', 'MAINTENANCE'], 
      default: 'ACTIVE' 
    },
  },
  {
    timestamps: true,
  }
);

const Market = mongoose.model<IMarket>('Market', marketSchema);
export default Market;
