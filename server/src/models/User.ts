import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IVirtualAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  reference: string;
  providerRef?: string;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  username?: string;
  profileImage?: string;
  email: string;
  phone: string;
  password: string;
  pin?: string;
  balance: number;
  isVerified: boolean;
  otp?: string;
  otpExpires?: Date;
  role: 'user' | 'admin';
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected';
  kycDocument?: string;
  virtualAccount?: IVirtualAccount;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
  comparePin(pin: string): Promise<boolean>;
}

const userSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, unique: true, sparse: true, lowercase: true },
    profileImage: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    pin: { type: String, select: false },
    balance: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    kycStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    kycDocument: { type: String },
    virtualAccount: {
      accountNumber: { type: String },
      accountName: { type: String },
      bankName: { type: String },
      bankCode: { type: String },
      reference: { type: String },
      providerRef: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password and pin before saving
userSchema.pre<IUser>('save', async function () {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (this.isModified('pin') && this.pin) {
    const salt = await bcrypt.genSalt(10);
    this.pin = await bcrypt.hash(this.pin, salt);
  }
});

// Compare password
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

// Compare pin
userSchema.methods.comparePin = async function (pin: string): Promise<boolean> {
  if (!this.pin) return false;
  return await bcrypt.compare(pin, this.pin);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
