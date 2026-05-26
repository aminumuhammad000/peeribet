import mongoose, { Schema, Document } from 'mongoose';

export interface IVaultBalance extends Document {
  custodyPool: number;
  escrowLocked: number;
  coldReserve: number;
  payoutBank: number;
}

const vaultBalanceSchema = new Schema(
  {
    custodyPool: { type: Number, default: 0 },
    escrowLocked: { type: Number, default: 0 },
    coldReserve: { type: Number, default: 0 },
    payoutBank: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const VaultBalance = mongoose.model<IVaultBalance>('VaultBalance', vaultBalanceSchema);
export default VaultBalance;
