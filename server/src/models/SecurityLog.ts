import mongoose, { Schema, Document } from 'mongoose';

export interface ISecurityLog extends Document {
  type: 'success' | 'warning' | 'danger' | 'info';
  text: string;
  meta: string;
  icon: string;
  createdAt: Date;
}

const securityLogSchema = new Schema(
  {
    type: { type: String, enum: ['success', 'warning', 'danger', 'info'], default: 'info' },
    text: { type: String, required: true },
    meta: { type: String },
    icon: { type: String },
  },
  {
    timestamps: true,
  }
);

const SecurityLog = mongoose.model<ISecurityLog>('SecurityLog', securityLogSchema);
export default SecurityLog;
