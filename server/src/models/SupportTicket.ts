import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportTicket extends Document {
  user: mongoose.Types.ObjectId;
  subject: string;
  category: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['Pending', 'In Progress', 'Resolved'], 
      default: 'Pending' 
    },
  },
  {
    timestamps: true,
  }
);

const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);
export default SupportTicket;
