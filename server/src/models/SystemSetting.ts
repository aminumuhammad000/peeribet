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
  referralEnabled: boolean;
  referrerBonus: number;
  refereeBonus: number;
  referralMinTradeRequirement: number;
  referralDescription?: string;
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
    referralEnabled: { type: Boolean, default: true },
    referrerBonus: { type: Number, default: 1000 },
    refereeBonus: { type: Number, default: 1000 },
    referralMinTradeRequirement: { type: Number, default: 0 },
    referralDescription: { 
      type: String, 
      default: 'Invite friends to Peeritrade. Both you and your friend receive ₦1,000 bonus upon registration!' 
    },
  },
  {
    timestamps: true,
  }
);

const SystemSetting = mongoose.model<ISystemSetting>('SystemSetting', systemSettingSchema);
export default SystemSetting;
