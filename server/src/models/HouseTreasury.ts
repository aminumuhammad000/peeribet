import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITreasuryRecord {
  source: 'P2P_FEE' | 'POOL_FEE' | 'BRIDGE_SURPLUS';
  amount: number;
  matchId?: Types.ObjectId;
  referenceId?: Types.ObjectId;
  description: string;
  createdAt: Date;
}

export interface IHouseTreasury extends Document {
  totalRevenue: number;
  totalP2PFees: number;
  totalPoolFees: number;
  totalBridgeSurplus: number;
  records: ITreasuryRecord[];
}

const houseTreasurySchema = new Schema(
  {
    totalRevenue: { type: Number, default: 0 },
    totalP2PFees: { type: Number, default: 0 },
    totalPoolFees: { type: Number, default: 0 },
    totalBridgeSurplus: { type: Number, default: 0 },
    records: [
      {
        source: {
          type: String,
          enum: ['P2P_FEE', 'POOL_FEE', 'BRIDGE_SURPLUS'],
          required: true,
        },
        amount: { type: Number, required: true },
        matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
        referenceId: { type: mongoose.Schema.Types.ObjectId },
        description: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const HouseTreasury = mongoose.model<IHouseTreasury>('HouseTreasury', houseTreasurySchema);

export const recordTreasuryIncome = async (
  source: 'P2P_FEE' | 'POOL_FEE' | 'BRIDGE_SURPLUS',
  amount: number,
  description: string,
  matchId?: any,
  referenceId?: any
) => {
  if (amount <= 0) return;
  try {
    let treasury = await HouseTreasury.findOne();
    if (!treasury) {
      treasury = await HouseTreasury.create({
        totalRevenue: 0,
        totalP2PFees: 0,
        totalPoolFees: 0,
        totalBridgeSurplus: 0,
        records: [],
      });
    }

    treasury.totalRevenue += amount;
    if (source === 'P2P_FEE') treasury.totalP2PFees += amount;
    else if (source === 'POOL_FEE') treasury.totalPoolFees += amount;
    else if (source === 'BRIDGE_SURPLUS') treasury.totalBridgeSurplus += amount;

    treasury.records.unshift({
      source,
      amount,
      matchId,
      referenceId,
      description,
      createdAt: new Date(),
    });

    if (treasury.records.length > 500) {
      treasury.records = treasury.records.slice(0, 500);
    }

    await treasury.save();
  } catch (err) {
    console.error('[Treasury] Failed to record income:', err);
  }
};

export default HouseTreasury;
