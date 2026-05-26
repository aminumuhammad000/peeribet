import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSetting extends Document {
  platformFee: number;
  settlementMode: 'AUTOMATED' | 'DELAYED' | 'MANUAL';
  complianceThreshold: number;
}

const systemSettingSchema = new Schema(
  {
    platformFee: { type: Number, default: 1.5 },
    settlementMode: { 
      type: String, 
      enum: ['AUTOMATED', 'DELAYED', 'MANUAL'], 
      default: 'AUTOMATED' 
    },
    complianceThreshold: { type: Number, default: 1000000 },
  },
  {
    timestamps: true,
  }
);

const SystemSetting = mongoose.model<ISystemSetting>('SystemSetting', systemSettingSchema);
export default SystemSetting;
