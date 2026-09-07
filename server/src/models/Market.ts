import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMarketOption {
  id: string;
  label: string;
  odds: number;
  totalStaked?: number;
}

export interface IMarket extends Document {
  title: string;
  category: 
    | 'European Football'
    | 'UFC & Boxing'
    | 'NBA Basketball'
    | 'Entertainment'
    | 'Politics'
    | 'Real Life Events'
    | 'Pop Culture';
  subcategory: string;
  marketType: 'YES_NO' | 'MULTIPLE_CHOICE';
  options: IMarketOption[];
  rules: string;
  resolutionSource?: string;
  poolAmount: number;
  volume: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'RESOLVED' | 'VOIDED' | 'MAINTENANCE';
  winningOption?: string;
  closingDate?: Date;
  resolutionDate?: Date;
  resolvedAt?: Date;
  isBackdoorManual: boolean;
  creator?: Types.ObjectId;
  image?: string;
  // Legacy fields for backward compatibility
  pair?: string;
  rate?: number;
  change?: string;
  createdAt: Date;
  updatedAt: Date;
}

const marketOptionSchema = new Schema<IMarketOption>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    odds: { type: Number, required: true, default: 1.9 },
    totalStaked: { type: Number, default: 0 },
  },
  { _id: false }
);

const marketSchema = new Schema<IMarket>(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        'European Football',
        'UFC & Boxing',
        'NBA Basketball',
        'Entertainment',
        'Politics',
        'Real Life Events',
        'Pop Culture',
      ],
      index: true,
    },
    subcategory: { type: String, default: 'General', index: true },
    marketType: {
      type: String,
      enum: ['YES_NO', 'MULTIPLE_CHOICE'],
      default: 'YES_NO',
    },
    options: {
      type: [marketOptionSchema],
      default: [
        { id: 'yes', label: 'Yes', odds: 1.85, totalStaked: 0 },
        { id: 'no', label: 'No', odds: 1.95, totalStaked: 0 },
      ],
    },
    rules: { type: String, default: '' },
    resolutionSource: { type: String, default: '' },
    poolAmount: { type: Number, default: 0 },
    volume: { type: String, default: '₦0' },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'CLOSED', 'RESOLVED', 'VOIDED', 'MAINTENANCE'],
      default: 'ACTIVE',
      index: true,
    },
    winningOption: { type: String },
    closingDate: { type: Date },
    resolutionDate: { type: Date },
    resolvedAt: { type: Date },
    isBackdoorManual: { type: Boolean, default: true },
    creator: { type: Schema.Types.ObjectId, ref: 'User' },
    image: { type: String, default: '' },
    // Backwards compatibility
    pair: { type: String },
    rate: { type: Number },
    change: { type: String, default: '0.0%' },
  },
  {
    timestamps: true,
  }
);

// Helpful compound index for fast market discovery
marketSchema.index({ category: 1, status: 1, subcategory: 1 });

const Market = mongoose.model<IMarket>('Market', marketSchema);
export default Market;
