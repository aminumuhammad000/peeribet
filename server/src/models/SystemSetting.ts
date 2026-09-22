import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSetting extends Document {
  platformFee: number;
  settlementMode: 'AUTOMATED' | 'DELAYED' | 'MANUAL';
  complianceThreshold: number;
  activePaymentGateway: 'vtstack' | 'paystack' | 'flutterwave' | 'monnify' | 'manual';
  paystackPublicKey?: string;
  paystackSecretKey?: string;
  vtstackApiKey?: string;
  vtstackPayoutKey?: string;
  vtstackWebhookSecret?: string;
  gatewayMode: 'TEST' | 'LIVE';
  autoWithdrawalApproval: boolean;
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
    activePaymentGateway: { 
      type: String, 
      enum: ['vtstack', 'paystack', 'flutterwave', 'monnify', 'manual'], 
      default: 'vtstack' 
    },
    paystackPublicKey: { type: String, default: '' },
    paystackSecretKey: { type: String, default: '' },
    vtstackApiKey: { type: String, default: '' },
    vtstackPayoutKey: { type: String, default: '' },
    vtstackWebhookSecret: { type: String, default: '' },
    gatewayMode: { type: String, enum: ['TEST', 'LIVE'], default: 'TEST' },
    autoWithdrawalApproval: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const SystemSetting = mongoose.model<ISystemSetting>('SystemSetting', systemSettingSchema);
export default SystemSetting;
